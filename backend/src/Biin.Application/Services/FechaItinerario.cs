using Biin.Domain.Exceptions;

namespace Biin.Application.Services;

/// <summary>Valida la fecha del itinerario según la zona IANA informada por el navegador.</summary>
public static class FechaItinerario
{
    public static DateOnly HoyEnZona(DateTimeOffset instanteUtc, string zonaHoraria)
    {
        if (string.IsNullOrWhiteSpace(zonaHoraria))
            throw new ReglaNegocioException("Indica la zona horaria local para validar la fecha del itinerario.");

        TimeZoneInfo zona;
        try
        {
            zona = TimeZoneInfo.FindSystemTimeZoneById(zonaHoraria);
        }
        catch (TimeZoneNotFoundException)
        {
            throw new ReglaNegocioException("La zona horaria indicada no es válida.");
        }
        catch (InvalidTimeZoneException)
        {
            throw new ReglaNegocioException("La zona horaria indicada no es válida.");
        }

        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(instanteUtc, zona).DateTime);
    }

    public static void ValidarNoPasada(DateOnly fecha, string? zonaHoraria, DateTimeOffset? instanteUtc = null)
    {
        if (string.IsNullOrWhiteSpace(zonaHoraria))
            throw new ReglaNegocioException("Indica la zona horaria local para validar la fecha del itinerario.");

        if (fecha < HoyEnZona(instanteUtc ?? DateTimeOffset.UtcNow, zonaHoraria))
            throw new ReglaNegocioException("La fecha del itinerario ya pasó en la zona horaria indicada. Elige hoy o un día futuro.");
    }
}
