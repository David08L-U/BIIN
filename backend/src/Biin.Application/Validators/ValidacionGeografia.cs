using Biin.Domain.Exceptions;

namespace Biin.Application.Validators;

/// <summary>Validaciones de coordenadas geográficas y radios de búsqueda para Yucatán (RF03, RNF05).</summary>
public static class ValidacionGeografia
{
    public const decimal LatitudMinimaYucatan = 19.40m;
    public const decimal LatitudMaximaYucatan = 21.80m;
    public const decimal LongitudMinimaYucatan = -90.60m;
    public const decimal LongitudMaximaYucatan = -87.30m;

    public const double RadioMinimoKm = 0.5;
    public const double RadioMaximoKm = 200.0;

    /// <summary>Valida rangos globales (±90, ±180) y devuelve coordenadas redondeadas a 6 decimales (numeric(9,6)).</summary>
    public static (decimal Latitud, decimal Longitud) ValidarGlobales(decimal latitud, decimal longitud)
    {
        if (latitud is < -90 or > 90 || longitud is < -180 or > 180)
            throw new ReglaNegocioException("Coordenadas fuera de rango (latitud ±90, longitud ±180).");

        return (Math.Round(latitud, 6), Math.Round(longitud, 6));
    }

    /// <summary>Indica si el punto cae dentro del marco geográfico de Yucatán.</summary>
    public static bool EstaEnYucatan(decimal latitud, decimal longitud) =>
        latitud is >= LatitudMinimaYucatan and <= LatitudMaximaYucatan &&
        longitud is >= LongitudMinimaYucatan and <= LongitudMaximaYucatan;

    /// <summary>
    /// Valida coordenadas de catálogo/ubicaciones de BIIN asegurando que estén dentro de Yucatán
    /// para prevenir errores frecuentes como invertir latitud y longitud.
    /// </summary>
    public static (decimal Latitud, decimal Longitud) ValidarEnYucatan(decimal latitud, decimal longitud)
    {
        var (lat, lon) = ValidarGlobales(latitud, longitud);
        if (!EstaEnYucatan(lat, lon))
            throw new ReglaNegocioException(
                $"Las coordenadas deben ubicarse dentro de Yucatán (latitud entre {LatitudMinimaYucatan} y {LatitudMaximaYucatan}, longitud entre {LongitudMinimaYucatan} y {LongitudMaximaYucatan}).");

        return (lat, lon);
    }

    public static double ValidarRadioKm(double radioKm)
    {
        if (double.IsNaN(radioKm) || double.IsInfinity(radioKm) || radioKm < RadioMinimoKm || radioKm > RadioMaximoKm)
            throw new ReglaNegocioException(
                $"El radio de búsqueda debe estar entre {RadioMinimoKm} y {RadioMaximoKm} km.");

        return radioKm;
    }
}
