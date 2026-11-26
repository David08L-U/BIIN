using Biin.Application.Services;
using Biin.Domain.Exceptions;

namespace Biin.UnitTests.Domain;

public sealed class FechaItinerarioTests
{
    private static readonly TimeZoneInfo ZonaMerida = TimeZoneInfo.FindSystemTimeZoneById("America/Merida");
    private static readonly DateTimeOffset Instante = new(2026, 3, 11, 6, 1, 0, TimeSpan.Zero);
    private static readonly DateOnly Hoy = new(2026, 3, 11);

    [Fact]
    public void HoyEnZona_usa_la_fecha_local_al_cruzar_medianoche()
    {
        var antesDeMedianoche = new DateTimeOffset(2026, 3, 11, 5, 59, 0, TimeSpan.Zero);

        Assert.Equal(new DateOnly(2026, 3, 10), FechaItinerario.HoyEnZona(antesDeMedianoche, "America/Merida"));
        Assert.Equal(Hoy, FechaItinerario.HoyEnZona(Instante, "America/Merida"));
    }

    [Theory]
    [InlineData(-1, false)]
    [InlineData(0, true)]
    [InlineData(1, true)]
    public void ValidarNoPasada_acepta_hoy_y_futuro_y_rechaza_ayer(int dias, bool valido)
    {
        var fecha = Hoy.AddDays(dias);

        if (valido) FechaItinerario.ValidarNoPasada(fecha, ZonaMerida.Id, Instante);
        else Assert.Throws<ReglaNegocioException>(() => FechaItinerario.ValidarNoPasada(fecha, ZonaMerida.Id, Instante));
    }

    [Fact]
    public void ValidarNoPasada_requiere_una_zona_horaria_conocida()
    {
        Assert.Throws<ReglaNegocioException>(() => FechaItinerario.ValidarNoPasada(Hoy, null, Instante));
        Assert.Throws<ReglaNegocioException>(() => FechaItinerario.ValidarNoPasada(Hoy, "zona-inexistente", Instante));
    }
}
