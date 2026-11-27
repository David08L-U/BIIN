using Biin.Application.DTOs.Transporte;
using Biin.Application.Interfaces;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>Consulta pública de tarifas aproximadas vigentes por ruta y tramo (RF03, RNF07, CU-03).</summary>
public class TarifasService(IAppDbContext db, IReloj reloj)
{
    public const string NotaTarifaAproximada =
        "Tarifas aproximadas en MXN; pueden variar según operador y vigencia.";

    public async Task<TarifasRutaResponse> ObtenerVigentesPorRutaAsync(
        int idRuta,
        FiltroTarifasRutaRequest? filtro = null,
        CancellationToken ct = default)
    {
        filtro ??= new FiltroTarifasRutaRequest();
        ValidarFiltro(filtro);

        var ruta = await db.Rutas
            .AsNoTracking()
            .Include(r => r.Recurso)
            .Include(r => r.Paradas)
                .ThenInclude(p => p.Ubicacion)
                    .ThenInclude(u => u.Localidad)
            .SingleOrDefaultAsync(r =>
                r.IdRecurso == idRuta &&
                r.Activa &&
                r.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado, ct)
            ?? throw new NoEncontradoException("Ruta no encontrada.");

        var fecha = filtro.Fecha ?? DateOnly.FromDateTime(ZonaYucatan.ALocal(reloj.AhoraUtc));

        var consulta = db.Tarifas
            .AsNoTracking()
            .Where(t => t.IdRuta == idRuta &&
                        t.VigenteDesde <= fecha &&
                        (t.VigenteHasta == null || t.VigenteHasta >= fecha));

        if (filtro.OrdenOrigen.HasValue)
            consulta = consulta.Where(t => t.OrdenOrigen == filtro.OrdenOrigen.Value);

        if (filtro.OrdenDestino.HasValue)
            consulta = consulta.Where(t => t.OrdenDestino == filtro.OrdenDestino.Value);

        var filas = await consulta
            .OrderBy(t => t.OrdenOrigen)
            .ThenBy(t => t.OrdenDestino)
            .ToListAsync(ct);

        var localidadesPorOrden = ruta.Paradas.ToDictionary(
            p => p.Orden,
            p => p.Ubicacion?.Localidad?.Nombre ?? $"Parada {p.Orden}");

        var tarifas = filas.Select(t => new TarifaVigenteDto(
            t.IdTarifa,
            t.IdRuta,
            t.OrdenOrigen,
            localidadesPorOrden.GetValueOrDefault(t.OrdenOrigen, $"Parada {t.OrdenOrigen}"),
            t.OrdenDestino,
            localidadesPorOrden.GetValueOrDefault(t.OrdenDestino, $"Parada {t.OrdenDestino}"),
            t.Monto,
            t.VigenteDesde,
            t.VigenteHasta)).ToList();

        return new TarifasRutaResponse(
            ruta.IdRecurso,
            ruta.Codigo,
            ruta.Recurso.Titulo,
            fecha,
            ruta.Recurso.ActualizadoEn,
            NotaTarifaAproximada,
            tarifas);
    }

    public async Task<TarifaVigenteDto?> ObtenerVigentePorTramoAsync(
        int idRuta,
        int ordenOrigen,
        int ordenDestino,
        DateOnly? fecha = null,
        CancellationToken ct = default)
    {
        var resp = await ObtenerVigentesPorRutaAsync(
            idRuta,
            new FiltroTarifasRutaRequest(ordenOrigen, ordenDestino, fecha),
            ct);
        return resp.Tarifas.FirstOrDefault();
    }

    private static void ValidarFiltro(FiltroTarifasRutaRequest filtro)
    {
        if (filtro.OrdenOrigen is <= 0)
            throw new ReglaNegocioException("El orden de origen debe ser mayor a cero.");

        if (filtro.OrdenDestino is <= 0)
            throw new ReglaNegocioException("El orden de destino debe ser mayor a cero.");

        if (filtro.OrdenOrigen.HasValue && filtro.OrdenDestino.HasValue &&
            filtro.OrdenDestino.Value <= filtro.OrdenOrigen.Value)
            throw new ReglaNegocioException("La parada de destino debe ser posterior a la parada de origen.");
    }
}
