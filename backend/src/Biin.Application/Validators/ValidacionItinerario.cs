using Biin.Domain.Exceptions;

namespace Biin.Application.Validators;

/// <summary>Reglas de itinerarios y actividades que se validan en el backend además de los CHECK de la BD (RF09).</summary>
public static class ValidacionItinerario
{
    public const int NombreMin = 2;
    public const int NombreMax = 120;
    public const int DiasMaximos = 60;
    public const int ActividadesMaximas = 50;
    public const int NotasMax = 500;

    public static string NormalizarNombre(string nombre)
    {
        var limpio = (nombre ?? string.Empty).Trim();
        if (limpio.Length is < NombreMin or > NombreMax)
            throw new ReglaNegocioException($"El nombre debe tener entre {NombreMin} y {NombreMax} caracteres.");
        return limpio;
    }

    public static void ValidarFechas(DateOnly inicio, DateOnly fin)
    {
        if (fin < inicio)
            throw new ReglaNegocioException("La fecha de fin no puede ser anterior a la de inicio.");
        if (fin.DayNumber - inicio.DayNumber + 1 > DiasMaximos)
            throw new ReglaNegocioException($"Un itinerario puede durar como máximo {DiasMaximos} días.");
    }

    public static void ValidarPresupuesto(decimal? presupuesto)
    {
        if (presupuesto is < 0)
            throw new ReglaNegocioException("El presupuesto no puede ser negativo.");
    }

    public static void ValidarHorario(DateTime? inicio, DateTime? fin)
    {
        if (inicio.HasValue && fin.HasValue && fin < inicio)
            throw new ReglaNegocioException("La hora de fin de la actividad no puede ser anterior a la de inicio.");
    }

    public static string? NormalizarNotas(string? notas)
    {
        var limpio = notas?.Trim();
        if (string.IsNullOrEmpty(limpio))
            return null;
        if (limpio.Length > NotasMax)
            throw new ReglaNegocioException($"Las notas no pueden pasar de {NotasMax} caracteres.");
        return limpio;
    }

    /// <summary>Las fechas de PostgreSQL (timestamptz) se guardan en UTC; se rechaza una hora sin zona.</summary>
    public static DateTime? AUtc(DateTime? fecha) => fecha switch
    {
        null => null,
        { Kind: DateTimeKind.Utc } f => f,
        { Kind: DateTimeKind.Local } f => f.ToUniversalTime(),
        _ => throw new ReglaNegocioException("Las horas de la actividad deben incluir zona horaria (por ejemplo 2026-12-12T15:00:00Z).")
    };
}
