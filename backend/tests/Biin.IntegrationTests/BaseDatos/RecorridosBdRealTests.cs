using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;

namespace Biin.IntegrationTests.BaseDatos;

/// <summary>Pruebas de recorridos sugeridos contra PostgreSQL real con la demo cargada (CU-13).</summary>
[Collection(ColeccionBdReal.Nombre)]
public class RecorridosBdRealTests(BdRealFactory factory) : IClassFixture<BdRealFactory>
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
    public async Task Recorridos_publicos_devuelven_el_recorrido_demo_de_Homun_con_sus_cinco_etapas_ordenadas()
    {
        var lista = await GetAsync<PaginaResultado<RecorridoResumenDto>>("/api/recorridos?busqueda=homun");
        var homun = Assert.Single(lista.Items, r => r.Titulo.Contains("cenotes en Homún"));
        Assert.Equal(5, homun.TotalEtapas);
        Assert.Equal(450, homun.DuracionTotalMin);

        var detalle = await GetAsync<RecorridoDetalleDto>($"/api/recorridos/{homun.IdRecorrido}");
        Assert.Equal([1, 2, 3, 4, 5], detalle.Etapas.Select(e => e.Orden).ToList());
        Assert.All(detalle.Etapas, e => Assert.True(e.Disponible));
        Assert.All(detalle.Etapas, e => Assert.NotNull(e.Latitud));
    }
}
