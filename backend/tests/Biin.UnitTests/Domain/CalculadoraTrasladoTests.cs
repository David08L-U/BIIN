using Biin.Domain.Entities;

namespace Biin.UnitTests.Domain;

public class CalculadoraTrasladoTests
{
    // Centros aproximados de Mérida y Homún (mismos que la demo)
    private const decimal MeridaLat = 20.967400m, MeridaLon = -89.623700m;
    private const decimal HomunLat = 20.739000m, HomunLon = -89.285800m;

    [Fact]
    public void Distancia_Merida_Homun_ronda_los_43_km_en_linea_recta()
    {
        var km = CalculadoraTraslado.DistanciaKm(MeridaLat, MeridaLon, HomunLat, HomunLon);

        Assert.InRange(km, 42, 45);
    }

    [Fact]
    public void Distancia_es_simetrica_y_cero_en_el_mismo_punto()
    {
        var ida = CalculadoraTraslado.DistanciaKm(MeridaLat, MeridaLon, HomunLat, HomunLon);
        var vuelta = CalculadoraTraslado.DistanciaKm(HomunLat, HomunLon, MeridaLat, MeridaLon);

        Assert.Equal(ida, vuelta, 6);
        Assert.Equal(0, CalculadoraTraslado.DistanciaKm(HomunLat, HomunLon, HomunLat, HomunLon), 6);
    }

    [Fact]
    public void Minutos_estimados_de_Merida_a_Homun_ronda_hora_y_media()
    {
        var km = CalculadoraTraslado.DistanciaKm(MeridaLat, MeridaLon, HomunLat, HomunLon);

        // 43.5 km * 1.3 / 40 km/h ≈ 85 minutos
        Assert.InRange(CalculadoraTraslado.MinutosEstimados(km), 80, 90);
    }

    [Theory]
    [InlineData(0.0, 0)]
    [InlineData(0.29, 0)]
    [InlineData(1.0, 2)]     // 1.3 km a 40 km/h = 1.95 min, se redondea hacia arriba
    [InlineData(40.0, 78)]
    public void Minutos_redondean_hacia_arriba_y_ignoran_distancias_cortas(double km, int esperado)
    {
        Assert.Equal(esperado, CalculadoraTraslado.MinutosEstimados(km));
    }
}
