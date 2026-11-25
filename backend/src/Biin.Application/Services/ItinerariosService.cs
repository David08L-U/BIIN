using Biin.Application.DTOs.Itinerarios;
using Biin.Application.Interfaces;
using Biin.Application.Validators;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>
/// Itinerarios del viajero registrado (RF09, CU-09, HU09). Cada usuario solo ve y modifica los suyos:
/// un itinerario ajeno responde como inexistente para no revelar que existe.
/// </summary>
public class ItinerariosService(IAppDbContext db, IReloj reloj)
{
    public async Task<IReadOnlyList<ItinerarioResumenDto>> ListarAsync(int idUsuario, CancellationToken ct = default) =>
        await db.Itinerarios
            .AsNoTracking()
            .Where(i => i.IdUsuario == idUsuario)
            .OrderByDescending(i => i.Inicio)
            .ThenByDescending(i => i.IdItinerario)
            .Select(i => new ItinerarioResumenDto(
                i.IdItinerario,
                i.Nombre,
                i.Inicio,
                i.Fin,
                i.PresupuestoEstimado,
                i.Actividades.Count,
                i.FechaCreacion))
            .ToListAsync(ct);

    public async Task<ItinerarioDetalleDto> ObtenerAsync(int idUsuario, int idItinerario, CancellationToken ct = default)
    {
        var itinerario = await CargarCompletoAsync(idUsuario, idItinerario, ct);
        return ADetalle(itinerario);
    }

    public async Task<ItinerarioDetalleDto> CrearAsync(int idUsuario, CrearItinerarioRequest req, CancellationToken ct = default)
    {
        var nombre = ValidacionItinerario.NormalizarNombre(req.Nombre);
        ValidacionItinerario.ValidarFechas(req.Inicio, req.Fin);
        ValidacionItinerario.ValidarPresupuesto(req.PresupuestoEstimado);

        var itinerario = new Itinerario
        {
            IdUsuario = idUsuario,
            Nombre = nombre,
            Inicio = req.Inicio,
            Fin = req.Fin,
            PresupuestoEstimado = req.PresupuestoEstimado,
            FechaCreacion = reloj.AhoraUtc
        };
        db.Itinerarios.Add(itinerario);
        await db.SaveChangesAsync(ct);

        return ADetalle(itinerario);
    }

    /// <summary>Cambia nombre, fechas o presupuesto. Si las nuevas fechas dejan fuera actividades, se advierte.</summary>
    public async Task<ItinerarioDetalleDto> ActualizarAsync(
        int idUsuario,
        int idItinerario,
        ActualizarItinerarioRequest req,
        CancellationToken ct = default)
    {
        var nombre = ValidacionItinerario.NormalizarNombre(req.Nombre);
        ValidacionItinerario.ValidarFechas(req.Inicio, req.Fin);
        ValidacionItinerario.ValidarPresupuesto(req.PresupuestoEstimado);

        var itinerario = await CargarCompletoAsync(idUsuario, idItinerario, ct, seguimiento: true);
        itinerario.Nombre = nombre;
        itinerario.Inicio = req.Inicio;
        itinerario.Fin = req.Fin;
        itinerario.PresupuestoEstimado = req.PresupuestoEstimado;
        await db.SaveChangesAsync(ct);

        return ADetalle(itinerario);
    }

    /// <summary>Elimina el itinerario y sus actividades (son datos propios del viajero, RF09).</summary>
    public async Task EliminarAsync(int idUsuario, int idItinerario, CancellationToken ct = default)
    {
        var itinerario = await db.Itinerarios
            .Include(i => i.Actividades)
            .SingleOrDefaultAsync(i => i.IdItinerario == idItinerario && i.IdUsuario == idUsuario, ct)
            ?? throw new NoEncontradoException("Itinerario no encontrado.");

        foreach (var actividad in itinerario.Actividades.ToList())
            db.ActividadesItinerario.Remove(actividad);
        db.Itinerarios.Remove(itinerario);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Agrega un negocio, evento, lugar o ruta publicado al final del itinerario. Si es un evento y no se
    /// indican horas, se usan las del evento. Los conflictos no bloquean: se devuelven como advertencias.
    /// </summary>
    public async Task<ItinerarioDetalleDto> AgregarActividadAsync(
        int idUsuario,
        int idItinerario,
        AgregarActividadRequest req,
        CancellationToken ct = default)
    {
        var inicio = ValidacionItinerario.AUtc(req.InicioPrevisto);
        var fin = ValidacionItinerario.AUtc(req.FinPrevisto);
        var notas = ValidacionItinerario.NormalizarNotas(req.Notas);

        var itinerario = await CargarCompletoAsync(idUsuario, idItinerario, ct, seguimiento: true);
        if (itinerario.Actividades.Count >= ValidacionItinerario.ActividadesMaximas)
            throw new ReglaNegocioException(
                $"Un itinerario puede tener como máximo {ValidacionItinerario.ActividadesMaximas} actividades.");

        var recurso = await db.Recursos
            .Include(r => r.HorariosVisita)
            .Include(r => r.Negocio!).ThenInclude(n => n.Ubicacion).ThenInclude(u => u.Localidad)
            .Include(r => r.Evento!).ThenInclude(e => e.Ubicacion).ThenInclude(u => u.Localidad)
            .Include(r => r.Lugar!).ThenInclude(l => l.Ubicacion).ThenInclude(u => u.Localidad)
            .SingleOrDefaultAsync(r => r.IdRecurso == req.IdRecurso, ct)
            ?? throw new NoEncontradoException("El contenido que quieres agregar no existe.");

        // Solo contenido validado y publicado entra a un itinerario (RF08, RF09)
        if (recurso.EstadoPublicacion != EstadoPublicacion.Publicado)
            throw new ReglaNegocioException("Solo se pueden agregar contenidos publicados.");

        if (recurso.Evento is not null && inicio is null && fin is null)
        {
            inicio = recurso.Evento.Inicio;
            fin = recurso.Evento.Fin;
        }
        ValidacionItinerario.ValidarHorario(inicio, fin);

        var actividad = new ActividadItinerario
        {
            IdItinerario = itinerario.IdItinerario,
            Itinerario = itinerario,
            IdRecurso = recurso.IdRecurso,
            Recurso = recurso,
            Orden = itinerario.Actividades.Count == 0 ? 1 : itinerario.Actividades.Max(a => a.Orden) + 1,
            InicioPrevisto = inicio,
            FinPrevisto = fin,
            Notas = notas
        };
        itinerario.Actividades.Add(actividad);
        db.ActividadesItinerario.Add(actividad);
        await db.SaveChangesAsync(ct);

        return ADetalle(itinerario);
    }

    public async Task<ItinerarioDetalleDto> ActualizarActividadAsync(
        int idUsuario,
        int idItinerario,
        int idActividad,
        ActualizarActividadRequest req,
        CancellationToken ct = default)
    {
        var inicio = ValidacionItinerario.AUtc(req.InicioPrevisto);
        var fin = ValidacionItinerario.AUtc(req.FinPrevisto);
        ValidacionItinerario.ValidarHorario(inicio, fin);
        var notas = ValidacionItinerario.NormalizarNotas(req.Notas);

        var itinerario = await CargarCompletoAsync(idUsuario, idItinerario, ct, seguimiento: true);
        var actividad = itinerario.Actividades.SingleOrDefault(a => a.IdActividad == idActividad)
            ?? throw new NoEncontradoException("Actividad no encontrada en este itinerario.");

        actividad.InicioPrevisto = inicio;
        actividad.FinPrevisto = fin;
        actividad.Notas = notas;
        await db.SaveChangesAsync(ct);

        return ADetalle(itinerario);
    }

    /// <summary>Quita una actividad. El orden de las demás se conserva (puede quedar con huecos).</summary>
    public async Task<ItinerarioDetalleDto> QuitarActividadAsync(
        int idUsuario,
        int idItinerario,
        int idActividad,
        CancellationToken ct = default)
    {
        var itinerario = await CargarCompletoAsync(idUsuario, idItinerario, ct, seguimiento: true);
        var actividad = itinerario.Actividades.SingleOrDefault(a => a.IdActividad == idActividad)
            ?? throw new NoEncontradoException("Actividad no encontrada en este itinerario.");

        itinerario.Actividades.Remove(actividad);
        db.ActividadesItinerario.Remove(actividad);
        await db.SaveChangesAsync(ct);

        return ADetalle(itinerario);
    }

    /// <summary>
    /// Cambia el orden de las actividades. La lista debe traer todas las actividades una sola vez.
    /// Como UNIQUE (id_itinerario, orden) no es diferible en PostgreSQL, primero se mueven a números
    /// libres por encima del máximo actual y después se asigna 1..n.
    /// </summary>
    public async Task<ItinerarioDetalleDto> ReordenarActividadesAsync(
        int idUsuario,
        int idItinerario,
        ReordenarActividadesRequest req,
        CancellationToken ct = default)
    {
        var itinerario = await CargarCompletoAsync(idUsuario, idItinerario, ct, seguimiento: true);
        var actuales = itinerario.Actividades.ToDictionary(a => a.IdActividad);
        var nuevoOrden = req.IdActividades ?? [];

        if (nuevoOrden.Count != actuales.Count ||
            nuevoOrden.Distinct().Count() != nuevoOrden.Count ||
            nuevoOrden.Any(id => !actuales.ContainsKey(id)))
            throw new ReglaNegocioException("La lista debe incluir cada actividad del itinerario exactamente una vez.");

        if (actuales.Count == 0)
            return ADetalle(itinerario);

        var maximo = actuales.Values.Max(a => a.Orden);
        for (var i = 0; i < nuevoOrden.Count; i++)
            actuales[nuevoOrden[i]].Orden = maximo + i + 1;
        await db.SaveChangesAsync(ct);

        for (var i = 0; i < nuevoOrden.Count; i++)
            actuales[nuevoOrden[i]].Orden = i + 1;
        await db.SaveChangesAsync(ct);

        return ADetalle(itinerario);
    }

    private async Task<Itinerario> CargarCompletoAsync(
        int idUsuario,
        int idItinerario,
        CancellationToken ct,
        bool seguimiento = false)
    {
        var consulta = db.Itinerarios
            .Include(i => i.Actividades).ThenInclude(a => a.Recurso).ThenInclude(r => r.HorariosVisita)
            .Include(i => i.Actividades).ThenInclude(a => a.Recurso).ThenInclude(r => r.Negocio!).ThenInclude(n => n.Ubicacion).ThenInclude(u => u.Localidad)
            .Include(i => i.Actividades).ThenInclude(a => a.Recurso).ThenInclude(r => r.Evento!).ThenInclude(e => e.Ubicacion).ThenInclude(u => u.Localidad)
            .Include(i => i.Actividades).ThenInclude(a => a.Recurso).ThenInclude(r => r.Lugar!).ThenInclude(l => l.Ubicacion).ThenInclude(u => u.Localidad)
            .AsQueryable();

        if (!seguimiento)
            consulta = consulta.AsNoTracking();

        return await consulta.SingleOrDefaultAsync(i => i.IdItinerario == idItinerario && i.IdUsuario == idUsuario, ct)
            ?? throw new NoEncontradoException("Itinerario no encontrado.");
    }

    private static ItinerarioDetalleDto ADetalle(Itinerario i)
    {
        var (actividades, advertencias) = AnalizadorItinerario.Analizar(i);
        return new ItinerarioDetalleDto(
            i.IdItinerario,
            i.Nombre,
            i.Inicio,
            i.Fin,
            i.PresupuestoEstimado,
            i.FechaCreacion,
            actividades,
            advertencias);
    }
}
