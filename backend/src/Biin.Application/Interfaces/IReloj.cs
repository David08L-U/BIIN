namespace Biin.Application.Interfaces;

/// <summary>
/// Hora actual inyectable: permite probar reglas que dependen del momento
/// (negocio abierto ahora, eventos próximos, conflictos de horario) sin esperar al reloj real.
/// </summary>
public interface IReloj
{
    DateTime AhoraUtc { get; }
}

/// <summary>Conversión entre UTC y la hora local de Yucatán (America/Merida, UTC−6 sin horario de verano).</summary>
public static class ZonaYucatan
{
    private static readonly TimeZoneInfo Zona = Buscar();

    public static DateTime ALocal(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), Zona);

    /// <summary>Inicio del día local indicado, expresado en UTC (para filtrar columnas timestamptz).</summary>
    public static DateTime InicioDelDiaUtc(DateOnly fecha) =>
        TimeZoneInfo.ConvertTimeToUtc(fecha.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified), Zona);

    /// <summary>Convierte una fecha y hora local de Yucatán a UTC (para columnas timestamptz).</summary>
    public static DateTime AUtc(DateOnly fecha, TimeOnly hora) =>
        TimeZoneInfo.ConvertTimeToUtc(fecha.ToDateTime(hora, DateTimeKind.Unspecified), Zona);

    private static TimeZoneInfo Buscar()
    {
        foreach (var id in new[] { "America/Merida", "Central Standard Time (Mexico)" })
        {
            if (TimeZoneInfo.TryFindSystemTimeZoneById(id, out var zona))
                return zona;
        }
        // Yucatán está en UTC−6 todo el año desde 2022
        return TimeZoneInfo.CreateCustomTimeZone("Yucatan", TimeSpan.FromHours(-6), "Yucatán", "Yucatán");
    }
}
