using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Contenidos;

public class ExplorarServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly DatosPrueba _datos;
    private readonly ExplorarService _servicio;

    public ExplorarServiceTests()
    {
        _datos = DatosPrueba.Sembrar(_db);
        _servicio = new ExplorarService(_db, new RelojFijo());
    }

    [Fact]
    public async Task Sin_filtros_mezcla_tipos_publicados_sin_rutas_ni_eventos_pasados()
    {
        var pagina = await _servicio.ExplorarAsync(new FiltroExplorarRequest());

        var titulos = pagina.Items.Select(r => r.Titulo).ToList();
        Assert.Equal(5, pagina.Total);
        Assert.DoesNotContain("Mérida a Homún", titulos);        // ruta
        Assert.DoesNotContain("Feria de diciembre", titulos);     // evento terminado
        Assert.DoesNotContain("Taquería sin revisar", titulos);   // pendiente
        Assert.DoesNotContain("Cenote cerrado", titulos);         // archivado
    }

    [Fact]
    public async Task Por_categoria_devuelve_contenidos_con_sus_categorias()
    {
        var pagina = await _servicio.ExplorarAsync(new FiltroExplorarRequest(IdCategoria: _datos.Baile.IdCategoria));

        Assert.All(pagina.Items, r => Assert.Equal(TipoRecurso.Evento, r.Tipo));
        Assert.All(pagina.Items, r => Assert.Contains("Baile", r.Categorias));
        Assert.Equal(2, pagina.Total);
    }

    [Fact]
    public async Task Filtra_por_tipo()
    {
        var lugares = await _servicio.ExplorarAsync(new FiltroExplorarRequest(Tipo: TipoRecurso.Lugar));

        Assert.Equal("Cenote Santa Rosa", Assert.Single(lugares.Items).Titulo);
    }

    [Fact]
    public async Task Filtra_por_localidad()
    {
        // En Homún: cocina, cenote y vaquería (la feria ya pasó)
        var enHomun = await _servicio.ExplorarAsync(new FiltroExplorarRequest(IdLocalidad: _datos.LocHomun.IdLocalidad));

        Assert.Equal(3, enHomun.Total);
    }

    [Theory]
    [InlineData("cocina ECONOMICA", TipoRecurso.Negocio)]
    [InlineData("santa rosa", TipoRecurso.Lugar)]
    public async Task Busca_sin_acentos(string texto, TipoRecurso tipoEsperado)
    {
        var pagina = await _servicio.ExplorarAsync(new FiltroExplorarRequest(Busqueda: texto));

        Assert.Equal(tipoEsperado, Assert.Single(pagina.Items).Tipo);
    }

    [Fact]
    public async Task Pedir_rutas_lanza_ReglaNegocio()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ExplorarAsync(new FiltroExplorarRequest(Tipo: TipoRecurso.Ruta)));
    }

    [Fact]
    public async Task Filtra_y_ordena_por_proximidad_cuando_se_indican_coordenadas()
    {
        // Punto junto al cenote de Homún (~0 km del cenote, ~2 km de la plaza, ~43 km de Mérida)
        var cercanos = await _servicio.ExplorarAsync(
            new FiltroExplorarRequest(Lat: 20.7220m, Lng: -89.2920m, RadioKm: 10));

        Assert.Equal(3, cercanos.Total);
        Assert.Equal("Cenote Santa Rosa", cercanos.Items[0].Titulo);
        Assert.Equal(0, cercanos.Items[0].DistanciaKm);
        Assert.All(cercanos.Items, i => Assert.NotNull(i.DistanciaKm));
        Assert.True(cercanos.Items[0].DistanciaKm <= cercanos.Items[1].DistanciaKm);

        // Sin coordenadas, DistanciaKm es null
        var sinGps = await _servicio.ExplorarAsync(new FiltroExplorarRequest());
        Assert.All(sinGps.Items, i => Assert.Null(i.DistanciaKm));
    }

    [Fact]
    public async Task Proximidad_incompleta_o_radio_invalido_lanza_ReglaNegocio()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ExplorarAsync(new FiltroExplorarRequest(Lat: 20.7m)));
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ExplorarAsync(new FiltroExplorarRequest(RadioKm: 10)));
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ExplorarAsync(new FiltroExplorarRequest(Lat: 20.7m, Lng: -89.2m, RadioKm: 0.1)));
    }
}
