using Biin.Application.Services;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Catalogos;

public class CatalogosServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly CatalogosService _servicio;

    public CatalogosServiceTests()
    {
        DatosPrueba.Sembrar(_db);
        _servicio = new CatalogosService(_db);
    }

    [Fact]
    public async Task Categorias_cuentan_solo_contenido_publicado()
    {
        var categorias = await _servicio.ListarCategoriasAsync();

        Assert.Equal(["Baile", "Cenote", "Comida regional", "Museo"], categorias.Select(c => c.Nombre));
        // Comida regional: 2 publicados (el negocio pendiente no cuenta)
        Assert.Equal(2, categorias.Single(c => c.Nombre == "Comida regional").TotalPublicados);
        // Cenote: el archivado no cuenta
        Assert.Equal(1, categorias.Single(c => c.Nombre == "Cenote").TotalPublicados);
        Assert.Equal(0, categorias.Single(c => c.Nombre == "Museo").TotalPublicados);
    }

    [Fact]
    public async Task Municipios_se_ordenan_por_nombre()
    {
        var municipios = await _servicio.ListarMunicipiosAsync();

        Assert.Equal(["Homún", "Mérida"], municipios.Select(m => m.Nombre));
    }

    [Theory]
    [InlineData("homun", "Homún")]
    [InlineData("MERIDA", "Mérida")]
    [InlineData("  mér ", "Mérida")]
    public async Task Localidades_se_buscan_sin_acentos_ni_mayusculas(string busqueda, string esperada)
    {
        var localidades = await _servicio.ListarLocalidadesAsync(null, busqueda);

        var localidad = Assert.Single(localidades);
        Assert.Equal(esperada, localidad.Nombre);
    }

    [Fact]
    public async Task Localidades_se_filtran_por_municipio()
    {
        var localidades = await _servicio.ListarLocalidadesAsync(2, null);

        var localidad = Assert.Single(localidades);
        Assert.Equal("Mérida", localidad.Municipio);
    }

    [Fact]
    public async Task Localidades_sin_coincidencias_devuelve_lista_vacia()
    {
        Assert.Empty(await _servicio.ListarLocalidadesAsync(null, "valladolid"));
    }
}
