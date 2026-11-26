using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Biin.Application.DTOs.Catalogos;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Domain.Enums;

namespace Biin.IntegrationTests.BaseDatos;

/// <summary>
/// Endpoints públicos del módulo 12 contra la demo de Homún (crear_bd.ps1 -Demo).
/// Validan que EF Core traduce a SQL los filtros, la búsqueda sin acentos y las vistas.
/// </summary>
[Collection(ColeccionBdReal.Nombre)]
public class ContenidosPublicosBdRealTests(BdRealFactory factory) : IClassFixture<BdRealFactory>
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
    public async Task Catalogos_responden_sin_sesion_y_buscan_sin_acentos()
    {
        var categorias = await GetAsync<List<CategoriaDto>>("/api/catalogos/categorias");
        var localidades = await GetAsync<List<LocalidadDto>>("/api/catalogos/localidades?busqueda=HOMUN");

        Assert.Contains(categorias, c => c.Nombre == "Cenote" && c.TotalPublicados >= 1);
        Assert.Contains(localidades, l => l.Nombre == "Homún");
    }

    [FactBd]
    public async Task Negocios_filtra_por_texto_y_presupuesto_en_PostgreSQL()
    {
        var pagina = await GetAsync<PaginaResultado<NegocioResumenDto>>("/api/negocios?busqueda=cocina%20economica&precioMaximo=100");

        var cocina = Assert.Single(pagina.Items, n => n.Titulo.Contains("Cocina económica"));
        Assert.Equal("Homún", cocina.Localidad);

        var ficha = await GetAsync<NegocioDetalleDto>($"/api/negocios/{cocina.IdRecurso}");
        Assert.Equal(6, ficha.Horarios.Count);
        Assert.Contains(ficha.Categorias, c => c.Nombre == "Comida regional");
    }

    [FactBd]
    public async Task Eventos_muestran_cancelados_y_filtran_por_estado()
    {
        var todos = await GetAsync<PaginaResultado<EventoResumenDto>>("/api/eventos");
        var cancelados = await GetAsync<PaginaResultado<EventoResumenDto>>("/api/eventos?estado=cancelado");

        Assert.Contains(todos.Items, e => e.EstadoEvento == EstadoEvento.Cancelado);
        Assert.All(cancelados.Items, e => Assert.Equal(EstadoEvento.Cancelado, e.EstadoEvento));
        Assert.True(todos.Items.Select(e => e.Inicio).SequenceEqual(todos.Items.Select(e => e.Inicio).Order()));
    }

    [FactBd]
    public async Task Lugares_no_exponen_contenido_pendiente()
    {
        var pagina = await GetAsync<PaginaResultado<LugarResumenDto>>("/api/lugares?tamano=100");

        Assert.Contains(pagina.Items, l => l.Titulo.Contains("Cenote de prueba"));
        Assert.DoesNotContain(pagina.Items, l => l.Titulo.Contains("pendiente"));

        using var client = factory.CreateClient();
        var idPendiente = await IdPorTituloAsync("[DEMO] Cenote pendiente de revisión");
        var resp = await client.GetAsync($"/api/lugares/{idPendiente}");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [FactBd]
    public async Task Explorar_por_categoria_usa_la_vista_de_publicados()
    {
        var categorias = await GetAsync<List<CategoriaDto>>("/api/catalogos/categorias");
        var cenote = categorias.Single(c => c.Nombre == "Cenote");

        var pagina = await GetAsync<PaginaResultado<RecursoExploradoDto>>($"/api/explorar?idCategoria={cenote.IdCategoria}");

        Assert.NotEmpty(pagina.Items);
        Assert.All(pagina.Items, r => Assert.Contains("Cenote", r.Categorias));
        Assert.DoesNotContain(pagina.Items, r => r.Titulo.Contains("pendiente"));

        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/explorar?tipo=ruta")).StatusCode);
    }

    private static async Task<int> IdPorTituloAsync(string titulo)
    {
        await using var db = BdPruebas.CrearContexto();
        return db.Recursos.Where(r => r.Titulo == titulo).Select(r => r.IdRecurso).Single();
    }
}
