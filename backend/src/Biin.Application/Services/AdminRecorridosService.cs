using Biin.Application.Consultas;
using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Comun;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>
/// Administración de recorridos sugeridos y sus etapas ordenadas con bitácora (RF12, CU-12, CU-13, 17.1.5).
/// </summary>
public class AdminRecorridosService(IAppDbContext db, IReloj reloj, IBitacoraAdmin bitacora)
{
    public async Task<PaginaResultado<RecorridoAdminResumenDto>> ListarAsync(
        FiltroAdminRecorridosRequest filtro,
        CancellationToken ct = default)
    {
        var (pagina, tamano) = Paginacion.Normalizar(filtro.Pagina, filtro.Tamano);

        var consulta = db.RecorridosSugeridos
            .AsNoTracking()
            .Include(r => r.LocalidadBase)
            .Include(r => r.Etapas)
            .AsQueryable();

        if (filtro.Estado.HasValue)
            consulta = consulta.Where(r => r.EstadoPublicacion == filtro.Estado.Value);

        if (filtro.IdLocalidadBase.HasValue)
            consulta = consulta.Where(r => r.IdLocalidadBase == filtro.IdLocalidadBase.Value);

        var texto = FuncionesBd.NormalizarTexto(filtro.Busqueda?.Trim());
        if (texto.Length > 0)
            consulta = consulta.Where(r =>
                FuncionesBd.Normalizar(r.Titulo).Contains(texto) ||
                FuncionesBd.Normalizar(r.Descripcion ?? string.Empty).Contains(texto));

        var total = await consulta.CountAsync(ct);
        var filas = await consulta
            .OrderByDescending(r => r.ActualizadoEn)
            .ThenBy(r => r.IdRecorrido)
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .ToListAsync(ct);

        var items = filas.Select(r => new RecorridoAdminResumenDto(
            r.IdRecorrido,
            r.Titulo,
            r.Descripcion,
            r.IdLocalidadBase,
            r.LocalidadBase.Nombre,
            r.EstadoPublicacion,
            r.Etapas.Count,
            r.Etapas.Sum(e => e.DuracionSugeridaMin ?? 0),
            r.ActualizadoEn)).ToList();

        return new PaginaResultado<RecorridoAdminResumenDto>(items, total, pagina, tamano);
    }

    public async Task<RecorridoAdminDetalleDto> ObtenerPorIdAsync(int idRecorrido, CancellationToken ct = default)
    {
        var recorrido = await CargarCompletoAsync(idRecorrido, ct)
            ?? throw new NoEncontradoException("Recorrido sugerido no encontrado.");
        return MapearDetalle(recorrido);
    }

    public async Task<RecorridoAdminDetalleDto> CrearAsync(
        int idAdmin,
        CrearRecorridoRequest req,
        CancellationToken ct = default)
    {
        var titulo = NormalizarTitulo(req.Titulo);
        var localidad = await db.Localidades
            .Include(l => l.Municipio)
            .SingleOrDefaultAsync(l => l.IdLocalidad == req.IdLocalidadBase, ct)
            ?? throw new ReglaNegocioException("La localidad base indicada no existe.");

        var recursosEtapas = req.Etapas is { Count: > 0 }
            ? await ValidarYCargarRecursosEtapasAsync(req.Etapas, ct)
            : [];

        var recorrido = new RecorridoSugerido
        {
            Titulo = titulo,
            Descripcion = string.IsNullOrWhiteSpace(req.Descripcion) ? null : req.Descripcion.Trim(),
            IdLocalidadBase = localidad.IdLocalidad,
            LocalidadBase = localidad,
            EstadoPublicacion = EstadoPublicacion.Pendiente,
            ActualizadoEn = reloj.AhoraUtc
        };

        db.RecorridosSugeridos.Add(recorrido);
        await db.SaveChangesAsync(ct);

        if (req.Etapas is { Count: > 0 })
        {
            AgregarEtapas(recorrido, req.Etapas, recursosEtapas);
            await db.SaveChangesAsync(ct);
        }

        bitacora.Registrar(idAdmin, AccionesBitacora.Crear, "recorridos_sugeridos", recorrido.IdRecorrido.ToString(),
            new { recorrido.Titulo, recorrido.IdLocalidadBase, totalEtapas = recorrido.Etapas.Count });
        await db.SaveChangesAsync(ct);

        var completo = await CargarCompletoAsync(recorrido.IdRecorrido, ct) ?? recorrido;
        return MapearDetalle(completo);
    }

    public async Task<RecorridoAdminDetalleDto> ActualizarAsync(
        int idAdmin,
        int idRecorrido,
        ActualizarRecorridoRequest req,
        CancellationToken ct = default)
    {
        var titulo = NormalizarTitulo(req.Titulo);
        var recorrido = await CargarCompletoAsync(idRecorrido, ct)
            ?? throw new NoEncontradoException("Recorrido sugerido no encontrado.");

        var localidad = await db.Localidades
            .Include(l => l.Municipio)
            .SingleOrDefaultAsync(l => l.IdLocalidad == req.IdLocalidadBase, ct)
            ?? throw new ReglaNegocioException("La localidad base indicada no existe.");

        var anterior = new { recorrido.Titulo, recorrido.IdLocalidadBase };
        recorrido.Titulo = titulo;
        recorrido.Descripcion = string.IsNullOrWhiteSpace(req.Descripcion) ? null : req.Descripcion.Trim();
        recorrido.IdLocalidadBase = localidad.IdLocalidad;
        recorrido.LocalidadBase = localidad;
        recorrido.ActualizadoEn = reloj.AhoraUtc;

        bitacora.Registrar(idAdmin, AccionesBitacora.Editar, "recorridos_sugeridos", recorrido.IdRecorrido.ToString(),
            new { anterior, nuevo = new { recorrido.Titulo, recorrido.IdLocalidadBase } });
        await db.SaveChangesAsync(ct);

        return MapearDetalle(recorrido);
    }

    public async Task<RecorridoAdminDetalleDto> ReemplazarEtapasAsync(
        int idAdmin,
        int idRecorrido,
        ReemplazarEtapasRecorridoRequest req,
        CancellationToken ct = default)
    {
        var recorrido = await CargarCompletoAsync(idRecorrido, ct)
            ?? throw new NoEncontradoException("Recorrido sugerido no encontrado.");

        var entradas = req.Etapas ?? [];
        var recursos = entradas.Count > 0
            ? await ValidarYCargarRecursosEtapasAsync(entradas, ct)
            : [];

        if (recorrido.EstadoPublicacion == EstadoPublicacion.Publicado)
        {
            if (entradas.Count < 2)
                throw new ReglaNegocioException("Un recorrido publicado debe conservar al menos 2 etapas.");
            if (entradas.Any(e => recursos[e.IdRecurso].EstadoPublicacion != EstadoPublicacion.Publicado))
                throw new ReglaNegocioException("Todas las etapas de un recorrido publicado deben ser contenidos publicados.");
        }

        var existentes = await db.EtapasRecorrido
            .Where(e => e.IdRecorrido == idRecorrido)
            .ToListAsync(ct);
        foreach (var e in existentes)
            db.EtapasRecorrido.Remove(e);
        recorrido.Etapas.Clear();
        await db.SaveChangesAsync(ct);

        AgregarEtapas(recorrido, entradas, recursos);
        recorrido.ActualizadoEn = reloj.AhoraUtc;

        bitacora.Registrar(idAdmin, AccionesBitacora.Editar, "etapas_recorrido", idRecorrido.ToString(),
            new { totalEtapas = entradas.Count, recursos = entradas.Select(e => e.IdRecurso).ToList() });
        await db.SaveChangesAsync(ct);

        var completo = await CargarCompletoAsync(idRecorrido, ct) ?? recorrido;
        return MapearDetalle(completo);
    }

    public async Task<RecorridoAdminDetalleDto> PublicarAsync(
        int idAdmin,
        int idRecorrido,
        CancellationToken ct = default)
    {
        var recorrido = await CargarCompletoAsync(idRecorrido, ct)
            ?? throw new NoEncontradoException("Recorrido sugerido no encontrado.");

        if (recorrido.Etapas.Count < 2)
            throw new ReglaNegocioException("Agrega al menos 2 etapas antes de publicar el recorrido.");

        if (recorrido.Etapas.Any(e => e.Recurso.EstadoPublicacion != EstadoPublicacion.Publicado))
            throw new ReglaNegocioException("Todas las etapas deben referenciar contenidos publicados antes de publicar el recorrido.");

        recorrido.EstadoPublicacion = EstadoPublicacion.Publicado;
        recorrido.ActualizadoEn = reloj.AhoraUtc;

        bitacora.Registrar(idAdmin, AccionesBitacora.Publicar, "recorridos_sugeridos", idRecorrido.ToString(),
            new { recorrido.Titulo, totalEtapas = recorrido.Etapas.Count });
        await db.SaveChangesAsync(ct);

        return MapearDetalle(recorrido);
    }

    public async Task<RecorridoAdminDetalleDto> ArchivarAsync(
        int idAdmin,
        int idRecorrido,
        CancellationToken ct = default)
    {
        var recorrido = await CargarCompletoAsync(idRecorrido, ct)
            ?? throw new NoEncontradoException("Recorrido sugerido no encontrado.");

        recorrido.EstadoPublicacion = EstadoPublicacion.Archivado;
        recorrido.ActualizadoEn = reloj.AhoraUtc;

        bitacora.Registrar(idAdmin, AccionesBitacora.Archivar, "recorridos_sugeridos", idRecorrido.ToString(),
            new { recorrido.Titulo });
        await db.SaveChangesAsync(ct);

        return MapearDetalle(recorrido);
    }

    private async Task<Dictionary<int, Recurso>> ValidarYCargarRecursosEtapasAsync(
        IReadOnlyList<EtapaRecorridoInput> etapas,
        CancellationToken ct)
    {
        foreach (var e in etapas)
        {
            if (e.IdRecurso <= 0)
                throw new ReglaNegocioException("El identificador de recurso en cada etapa debe ser mayor a cero.");
            if (e.DuracionSugeridaMin is <= 0 or > 1440)
                throw new ReglaNegocioException("La duración sugerida de cada etapa debe estar entre 1 y 1440 minutos.");
        }

        var ids = etapas.Select(e => e.IdRecurso).Distinct().ToList();
        var encontrados = await db.Recursos
            .Where(r => ids.Contains(r.IdRecurso))
            .ToDictionaryAsync(r => r.IdRecurso, ct);

        if (encontrados.Count != ids.Count)
            throw new ReglaNegocioException("Uno o más recursos indicados en las etapas no existen.");

        return encontrados;
    }

    private void AgregarEtapas(
        RecorridoSugerido recorrido,
        IReadOnlyList<EtapaRecorridoInput> entradas,
        Dictionary<int, Recurso> recursos)
    {
        for (var i = 0; i < entradas.Count; i++)
        {
            var entrada = entradas[i];
            var etapa = new EtapaRecorrido
            {
                IdRecorrido = recorrido.IdRecorrido,
                Orden = i + 1,
                IdRecurso = entrada.IdRecurso,
                DuracionSugeridaMin = entrada.DuracionSugeridaMin,
                Recorrido = recorrido,
                Recurso = recursos[entrada.IdRecurso]
            };
            recorrido.Etapas.Add(etapa);
            db.EtapasRecorrido.Add(etapa);
        }
    }

    private Task<RecorridoSugerido?> CargarCompletoAsync(int idRecorrido, CancellationToken ct) =>
        db.RecorridosSugeridos
            .Include(r => r.LocalidadBase).ThenInclude(l => l.Municipio)
            .Include(r => r.Etapas)
                .ThenInclude(e => e.Recurso)
                    .ThenInclude(rec => rec.Fotografias)
            .Include(r => r.Etapas)
                .ThenInclude(e => e.Recurso)
                    .ThenInclude(rec => rec.Negocio!)
                        .ThenInclude(n => n.Ubicacion)
                            .ThenInclude(u => u.Localidad)
            .Include(r => r.Etapas)
                .ThenInclude(e => e.Recurso)
                    .ThenInclude(rec => rec.Lugar!)
                        .ThenInclude(l => l.Ubicacion)
                            .ThenInclude(u => u.Localidad)
            .Include(r => r.Etapas)
                .ThenInclude(e => e.Recurso)
                    .ThenInclude(rec => rec.Evento!)
                        .ThenInclude(ev => ev.Ubicacion)
                            .ThenInclude(u => u.Localidad)
            .Include(r => r.Etapas)
                .ThenInclude(e => e.Recurso)
                    .ThenInclude(rec => rec.Ruta!)
                        .ThenInclude(rt => rt.Paradas)
                            .ThenInclude(p => p.Ubicacion)
                                .ThenInclude(u => u.Localidad)
            .SingleOrDefaultAsync(r => r.IdRecorrido == idRecorrido, ct);

    private static string NormalizarTitulo(string? titulo)
    {
        var limpio = (titulo ?? string.Empty).Trim();
        if (limpio.Length is < 3 or > 150)
            throw new ReglaNegocioException("El título debe tener entre 3 y 150 caracteres.");
        return limpio;
    }

    private static RecorridoAdminDetalleDto MapearDetalle(RecorridoSugerido r)
    {
        var etapas = r.Etapas.OrderBy(e => e.Orden).Select(RecorridosService.MapearEtapa).ToList();
        return new RecorridoAdminDetalleDto(
            r.IdRecorrido,
            r.Titulo,
            r.Descripcion,
            r.IdLocalidadBase,
            r.LocalidadBase.Nombre,
            r.LocalidadBase.IdMunicipio,
            r.LocalidadBase.Municipio.Nombre,
            r.EstadoPublicacion,
            r.Etapas.Sum(e => e.DuracionSugeridaMin ?? 0),
            r.ActualizadoEn,
            etapas);
    }
}
