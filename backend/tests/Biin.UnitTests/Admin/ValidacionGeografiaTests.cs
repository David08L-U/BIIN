using Biin.Application.Validators;
using Biin.Domain.Exceptions;

namespace Biin.UnitTests.Admin;

/// <summary>Pruebas de validación de coordenadas geográficas y límites de Yucatán (RF03, RNF05).</summary>
public class ValidacionGeografiaTests
{
    [Theory]
    [InlineData(20.967400, -89.623700)] // Mérida
    [InlineData(20.739000, -89.285800)] // Homún
    [InlineData(20.689600, -88.202200)] // Valladolid
    [InlineData(20.397800, -89.533900)] // Ticul
    public void ValidarEnYucatan_acepta_coordenadas_del_estado_y_redondea_a_seis_decimales(decimal lat, decimal lon)
    {
        var (rLat, rLon) = ValidacionGeografia.ValidarEnYucatan(lat + 0.0000004m, lon - 0.0000004m);

        Assert.Equal(lat, rLat);
        Assert.Equal(lon, rLon);
        Assert.True(ValidacionGeografia.EstaEnYucatan(rLat, rLon));
    }

    [Theory]
    [InlineData(-89.6237, 20.9674)] // Latitud y longitud invertidas
    [InlineData(19.4326, -99.1332)] // CDMX (fuera de Yucatán)
    [InlineData(95.0, -89.5)]       // Fuera de rango global
    [InlineData(20.9, -190.0)]      // Fuera de rango global
    public void ValidarEnYucatan_rechaza_coordenadas_invertidas_o_fuera_de_Yucatan(decimal lat, decimal lon)
    {
        Assert.Throws<ReglaNegocioException>(() => ValidacionGeografia.ValidarEnYucatan(lat, lon));
    }

    [Theory]
    [InlineData(0.1)]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(250)]
    public void ValidarRadioKm_rechaza_valores_fuera_de_rango(double radio)
    {
        Assert.Throws<ReglaNegocioException>(() => ValidacionGeografia.ValidarRadioKm(radio));
    }

    [Fact]
    public void ValidarRadioKm_acepta_radios_validos()
    {
        Assert.Equal(15, ValidacionGeografia.ValidarRadioKm(15));
    }
}
