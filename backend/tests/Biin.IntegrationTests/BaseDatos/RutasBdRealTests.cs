using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Transporte;
using Biin.Domain.Vistas;

namespace Biin.IntegrationTests.BaseDatos;

/// <summary>
/// Pruebas contra PostgreSQL real para búsqueda origen→destino, detalle, regreso, salidas y rutas cercanas (RF02, RF03, CU-02, CU-03).
/// </summary>
[Collection(ColeccionBdReal.Nombre)]
public class RutasBdRealTests(BdRealFactory factory) : IClassFixture<BdRealFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) }
    };

    private async Task<T> GetAsync<T>(string url)
    {
        using var client = factory.CreateClient();
        var resp = await client.GetAsync(url);
        Assert.True(resp.IsSuccessStatusCode, $"{url} respondió {(int)resp.StatusCode}: {await resp.Content.ReadAsStringAsync()}");
        return (await resp.Content.ReadFromJsonAsync<T>(Json))!;
    }

    [FactBd]
    public async Task Busqueda_origen_destino_y_detalle_con_regreso_y_salidas_en_PostgreSQL()
    {
        var ida = await GetAsync<PaginaResultado<RutaResumenDto>>("/api/rutas?origen=merida&destino=homun");
        var merHom = Assert.Single(ida.Items, r => r.Codigo == "DEMO-MER-HOM");
        Assert.Equal("Mérida", merHom.Origen);
        Assert.Equal("Homún", merHom.Destino);
        Assert.Equal(45m, merHom.TarifaAproximada);

        var detalle = await GetAsync<RutaDetalleDto>($"/api/rutas/{merHom.IdRuta}");
        Assert.Equal(5, detalle.Paradas.Count);
        Assert.NotEmpty(detalle.PuntosRecorrido);
        Assert.NotEmpty(detalle.Horarios);
        Assert.NotEmpty(detalle.Tarifas);
        Assert.Contains(detalle.RutasRegreso, r => r.Codigo == "DEMO-HOM-MER");

        var salidas = await GetAsync<SalidasRutaResponse>($"/api/rutas/{merHom.IdRuta}/salidas");
        Assert.Equal("DEMO-MER-HOM", salidas.Codigo);
        Assert.NotEmpty(salidas.Salidas);
        Assert.All(salidas.Salidas, s => Assert.Contains(s.EstadoCupo, new[] { VCupoVigente.EstadoVigente, VCupoVigente.EstadoNoConfirmado }));
    }

    [FactBd]
    public async Task Rutas_cercanas_por_GPS_encuentra_paradas_de_abordaje_en_PostgreSQL()
    {
        var cercanas = await GetAsync<List<RutaCercanaDto>>("/api/rutas/cercanas?lat=20.7390&lng=-89.2858&radioKm=10");

        Assert.Contains(cercanas, r => r.Codigo == "DEMO-HOM-MER" && r.LocalidadParada == "Homún");
    }
}
