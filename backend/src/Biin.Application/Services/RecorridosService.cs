using Biin.Application.Consultas;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>Consulta pública de recorridos sugeridos publicados y sus etapas ordenadas (CU-13, RF01, RNF07).</summary>
public class RecorridosService(IAppDbContext db)
{
    public async Task<PaginaResultado<RecorridoResumenDto>> ListarAsync(
        FiltroRecorridosRequest filtro,
        CancellationToken ct = default)
    {
        var (pagina, tamano) = Paginacion.Normalizar(filtro.Pagina, filtro.Tamano);

        var consulta = db.RecorridosSugeridos
            .AsNoTracking()
            .Include(r => r.LocalidadBase).ThenInclude(l => l.Municipio)
            .Include(r => r.Etapas)
                .ThenInclude(e => e.Recurso)
                    .ThenInclude(rec => rec.Fotografias)
            .Where(r => r.EstadoPublicacion == EstadoPublicacion.Publicado);

        if (filtro.IdLocalidadBase.HasValue)
            consulta = consulta.Where(r => r.IdLocalidadBase == filtro.IdLocalidadBase.Value);

        if (filtro.IdMunicipio.HasValue)
            consulta = consulta.Where(r => r.LocalidadBase.IdMunicipio == filtro.IdMunicipio.Value);

        var texto = FuncionesBd.NormalizarTexto(filtro.Busqueda?.Trim());
        if (texto.Length > 0)
            consulta = consulta.Where(r =>
                FuncionesBd.Normalizar(r.Titulo).Contains(texto) ||
                FuncionesBd.Normalizar(r.Descripcion ?? string.Empty).Contains(texto) ||
                FuncionesBd.Normalizar(r.LocalidadBase.Nombre).Contains(texto));

        var total = await consulta.CountAsync(ct);
        var filas = await consulta
            .OrderBy(r => r.Titulo)
            .ThenBy(r => r.IdRecorrido)
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .ToListAsync(ct);

        var items = filas.Select(r =>
        {
            var etapasOrdenadas = r.Etapas.OrderBy(e => e.Orden).ToList();
            var duracion = etapasOrdenadas.Sum(e => e.DuracionSugeridaMin ?? 0);
            var foto = etapasOrdenadas
                .SelectMany(e => e.Recurso.Fotografias.OrderBy(f => f.Orden))
                .Select(f => f.UrlArchivo)
                .FirstOrDefault();

            return new RecorridoResumenDto(
                r.IdRecorrido,
                r.Titulo,
                r.Descripcion,
                r.IdLocalidadBase,
                r.LocalidadBase.Nombre,
                r.LocalidadBase.IdMunicipio,
                r.LocalidadBase.Municipio.Nombre,
                etapasOrdenadas.Count,
                duracion,
                foto,
                r.ActualizadoEn);
        }).ToList();

        return new PaginaResultado<RecorridoResumenDto>(items, total, pagina, tamano);
    }

    public async Task<RecorridoDetalleDto> ObtenerPorIdAsync(int idRecorrido, CancellationToken ct = default)
    {
        if (idRecorrido <= 0)
            throw new ReglaNegocioException("El identificador del recorrido debe ser mayor a cero.");

        var recorrido = await db.RecorridosSugeridos
            .AsNoTracking()
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
            .SingleOrDefaultAsync(r =>
                r.IdRecorrido == idRecorrido &&
                r.EstadoPublicacion == EstadoPublicacion.Publicado, ct)
            ?? throw new NoEncontradoException("Recorrido sugerido no encontrado.");

        var etapasOrdenadas = recorrido.Etapas.OrderBy(e => e.Orden).ToList();
        var etapasDto = etapasOrdenadas.Select(MapearEtapa).ToList();

        return new RecorridoDetalleDto(
            recorrido.IdRecorrido,
            recorrido.Titulo,
            recorrido.Descripcion,
            recorrido.IdLocalidadBase,
            recorrido.LocalidadBase.Nombre,
            recorrido.LocalidadBase.IdMunicipio,
            recorrido.LocalidadBase.Municipio.Nombre,
            etapasOrdenadas.Sum(e => e.DuracionSugeridaMin ?? 0),
            recorrido.ActualizadoEn,
            etapasDto);
    }

    internal static EtapaRecorridoDto MapearEtapa(EtapaRecorrido etapa)
    {
        var rec = etapa.Recurso;
        var ubicacion = ResolverUbicacion(rec);
        var foto = rec.Fotografias.OrderBy(f => f.Orden).Select(f => f.UrlArchivo).FirstOrDefault();
        var (disponible, aviso) = EvaluarDisponibilidad(rec);

        return new EtapaRecorridoDto(
            etapa.Orden,
            rec.IdRecurso,
            rec.Tipo,
            rec.Titulo,
            rec.Descripcion,
            etapa.DuracionSugeridaMin,
            ubicacion?.Latitud,
            ubicacion?.Longitud,
            ubicacion?.Localidad?.Nombre,
            foto,
            disponible,
            aviso);
    }

    private static Ubicacion? ResolverUbicacion(Recurso rec) =>
        rec.Negocio?.Ubicacion
        ?? rec.Lugar?.Ubicacion
        ?? rec.Evento?.Ubicacion
        ?? rec.Ruta?.Paradas.OrderBy(p => p.Orden).FirstOrDefault()?.Ubicacion;

    private static (bool Disponible, string? Aviso) EvaluarDisponibilidad(Recurso rec)
    {
        if (rec.EstadoPublicacion != EstadoPublicacion.Publicado)
            return (false, "Este contenido ya no está publicado.");

        if (rec.Tipo == TipoRecurso.Ruta && rec.Ruta is { Activa: false })
            return (false, "Esta ruta de transporte se encuentra inactiva.");

        if (rec.Tipo == TipoRecurso.Evento && rec.Evento is not null)
        {
            if (rec.Evento.EstadoEvento == EstadoEvento.Cancelado)
                return (false, "Este evento fue cancelado.");
            if (rec.Evento.EstadoEvento == EstadoEvento.Finalizado)
                return (false, "Este evento ya finalizó.");
        }

        return (true, null);
    }
}
