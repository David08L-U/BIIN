using Biin.Application.DTOs.Transporte;
using Biin.Application.Interfaces;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>Exposición de paradas y puntos de recorrido para el mapa Leaflet de una ruta publicada (RF03, CU-03).</summary>
public class MapaRutaService(IAppDbContext db)
{
    public async Task<MapaRutaResponse> ObtenerMapaAsync(int idRuta, CancellationToken ct = default)
    {
        if (idRuta <= 0)
            throw new ReglaNegocioException("El identificador de la ruta debe ser mayor a cero.");

        var ruta = await db.Rutas
            .AsNoTracking()
            .Include(r => r.Recurso)
            .Include(r => r.Paradas)
                .ThenInclude(p => p.Ubicacion)
                    .ThenInclude(u => u.Localidad)
                        .ThenInclude(l => l.Municipio)
            .Include(r => r.Puntos)
            .SingleOrDefaultAsync(r =>
                r.IdRecurso == idRuta &&
                r.Activa &&
                r.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado, ct)
            ?? throw new NoEncontradoException("Ruta no encontrada.");

        var paradas = ruta.Paradas
            .OrderBy(p => p.Orden)
            .Select(p => new ParadaMapaDto(
                p.Orden,
                p.IdUbicacion,
                p.Ubicacion?.DireccionReferencia,
                p.Ubicacion?.Latitud ?? 0m,
                p.Ubicacion?.Longitud ?? 0m,
                p.Ubicacion?.IdLocalidad ?? 0,
                p.Ubicacion?.Localidad?.Nombre ?? $"Parada {p.Orden}",
                p.Ubicacion?.Localidad?.IdMunicipio ?? 0,
                p.Ubicacion?.Localidad?.Municipio?.Nombre ?? string.Empty,
                p.PermiteAbordar,
                p.PermiteDescender))
            .ToList();

        var puntos = ruta.Puntos.Count > 0
            ? ruta.Puntos
                .OrderBy(pt => pt.Orden)
                .Select(pt => new PuntoMapaDto(pt.Orden, pt.Latitud, pt.Longitud))
                .ToList()
            : paradas
                .Select((p, idx) => new PuntoMapaDto(idx + 1, p.Latitud, p.Longitud))
                .ToList();

        return new MapaRutaResponse(
            ruta.IdRecurso,
            ruta.Codigo,
            ruta.Recurso.Titulo,
            ruta.Recurso.ActualizadoEn,
            paradas,
            puntos);
    }
}
