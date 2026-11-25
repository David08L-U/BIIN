using Biin.Application.DTOs.Itinerarios;
using Biin.Application.Interfaces;
using Biin.Application.Validators;
using Biin.Domain.Entities;
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
