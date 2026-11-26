using Biin.Domain.Exceptions;

namespace Biin.Application.Validators;

/// <summary>Reglas de contenidos que se validan en el backend además de los CHECK y triggers de la BD (RF12).</summary>
public static class ValidacionContenido
{
    public const int TituloMin = 3;
    public const int TituloMax = 150;
    public const int DescripcionMax = 4000;

    public static string NormalizarTitulo(string titulo)
    {
        var limpio = (titulo ?? string.Empty).Trim();
        if (limpio.Length is < TituloMin or > TituloMax)
            throw new ReglaNegocioException($"El título debe tener entre {TituloMin} y {TituloMax} caracteres.");
        return limpio;
    }

    public static string? NormalizarTextoOpcional(string? texto, int maximo, string campo)
    {
        var limpio = texto?.Trim();
        if (string.IsNullOrEmpty(limpio))
            return null;
        if (limpio.Length > maximo)
            throw new ReglaNegocioException($"{campo} no puede pasar de {maximo} caracteres.");
        return limpio;
    }

    public static void ValidarMontoNoNegativo(decimal? monto, string campo)
    {
        if (monto is < 0)
            throw new ReglaNegocioException($"{campo} no puede ser negativo.");
    }

    public static void ValidarRangoPrecios(decimal? minimo, decimal? maximo)
    {
        ValidarMontoNoNegativo(minimo, "El precio mínimo");
        ValidarMontoNoNegativo(maximo, "El precio máximo");
        if (minimo.HasValue && maximo.HasValue && maximo < minimo)
            throw new ReglaNegocioException("El precio máximo no puede ser menor que el mínimo.");
    }

    /// <summary>timestamptz exige UTC: se acepta UTC o una hora con zona; sin zona se rechaza.</summary>
    public static DateTime AUtc(DateTime fecha, string campo) => fecha.Kind switch
    {
        DateTimeKind.Utc => fecha,
        DateTimeKind.Local => fecha.ToUniversalTime(),
        _ => throw new ReglaNegocioException($"{campo} debe incluir zona horaria (por ejemplo 2026-12-12T19:00:00-06:00).")
    };

    /// <summary>URL absoluta http(s) o ruta relativa del sitio (/fotos/...).</summary>
    public static string ValidarUrlFoto(string url)
    {
        var limpio = (url ?? string.Empty).Trim();
        var valida = limpio.StartsWith('/') && !limpio.StartsWith("//") ||
                     Uri.TryCreate(limpio, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp);
        if (!valida || limpio.Length > 500)
            throw new ReglaNegocioException("La URL de la fotografía debe ser http(s) o una ruta que empiece con '/'.");
        return limpio;
    }
}
