using Biin.Application.DTOs.Transporte;
using Biin.Application.Interfaces;
using Biin.Application.Validators;
using Biin.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>
/// Búsqueda opcional de localidades y paradas de abordaje cercanas cuando el usuario consiente GPS (RF02, RNF05).
/// Si el usuario rechaza el GPS, los demás endpoints siguen operando con selección manual sin requerir coordenadas.
/// </summary>
public class UbicacionesService(IAppDbContext db)
{
    public async Task<UbicacionesCercanasResponse> BuscarCercanasAsync(
        FiltroUbicacionesCercanasRequest req,
        CancellationToken ct = default)
    {
        var (lat, lng) = ValidacionGeografia.ValidarGlobales(req.Lat, req.Lng);
        var radioKm = ValidacionGeografia.ValidarRadioKm(req.RadioKm);
        var limite = Math.Clamp(req.Limite, 1, 50);

        var paradasRaw = await db.VParadasRuta
            .AsNoTracking()
            .Where(p => p.PermiteAbordar)
            .ToListAsync(ct);

        var paradasCercanas = paradasRaw
            .Select(p =>
            {
                var distancia = CalculadoraTraslado.DistanciaKm(lat, lng, p.Latitud, p.Longitud);
                return new
                {
                    Parada = p,
                    Distancia = distancia
                };
            })
            .Where(x => x.Distancia <= radioKm)
            .OrderBy(x => x.Distancia)
            .ThenBy(x => x.Parada.Codigo)
            .ThenBy(x => x.Parada.Orden)
            .Take(limite)
            .Select(x => new ParadaCercanaDto(
                x.Parada.IdRuta,
                x.Parada.Codigo,
                x.Parada.Ruta,
                x.Parada.Orden,
                x.Parada.IdUbicacion,
                x.Parada.DireccionReferencia,
                x.Parada.Latitud,
                x.Parada.Longitud,
                x.Parada.IdLocalidad,
                x.Parada.Localidad,
                x.Parada.IdMunicipio,
                x.Parada.Municipio,
                Math.Round(x.Distancia, 2),
                CalculadoraTraslado.MinutosEstimados(x.Distancia)))
            .ToList();

        var ubicacionesRaw = await db.Ubicaciones
            .AsNoTracking()
            .Include(u => u.Localidad).ThenInclude(l => l.Municipio)
            .ToListAsync(ct);

        var localidadesCercanas = ubicacionesRaw
            .Where(u => u.Localidad is not null && u.Localidad.Municipio is not null)
            .Select(u => new
            {
                u.IdLocalidad,
                Localidad = u.Localidad.Nombre,
                u.Localidad.IdMunicipio,
                Municipio = u.Localidad.Municipio.Nombre,
                Distancia = CalculadoraTraslado.DistanciaKm(lat, lng, u.Latitud, u.Longitud)
            })
            .Where(x => x.Distancia <= radioKm)
            .GroupBy(x => x.IdLocalidad)
            .Select(g => g.OrderBy(x => x.Distancia).First())
            .OrderBy(x => x.Distancia)
            .ThenBy(x => x.Localidad)
            .Take(limite)
            .Select(x => new LocalidadCercanaDto(
                x.IdLocalidad,
                x.Localidad,
                x.IdMunicipio,
                x.Municipio,
                Math.Round(x.Distancia, 2)))
            .ToList();

        return new UbicacionesCercanasResponse(lat, lng, radioKm, localidadesCercanas, paradasCercanas);
    }
}
