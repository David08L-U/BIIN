using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Contenidos;

public class LugaresServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly DatosPrueba _datos;
    private readonly LugaresService _servicio;

    public LugaresServiceTests()
    {
        _datos = DatosPrueba.Sembrar(_db);
        _servicio = new LugaresService(_db, new RelojFijo());
    }

    [Fact]
    public async Task Listar_excluye_lugares_archivados()
    {
        var pagina = await _servicio.ListarAsync(new FiltroLugaresRequest());

        Assert.Equal("Cenote Santa Rosa", Assert.Single(pagina.Items).Titulo);
    }

    [Fact]
    public async Task Listar_filtra_por_categoria_y_costo()
    {
        var cenotes = await _servicio.ListarAsync(new FiltroLugaresRequest(IdCategoria: _datos.Cenote.IdCategoria));
        var museos = await _servicio.ListarAsync(new FiltroLugaresRequest(IdCategoria: _datos.Museo.IdCategoria));
        var gratuitos = await _servicio.ListarAsync(new FiltroLugaresRequest(CostoMaximo: 0));

        Assert.Single(cenotes.Items);
        Assert.Empty(museos.Items);
        Assert.Empty(gratuitos.Items);
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ListarAsync(new FiltroLugaresRequest(CostoMaximo: -5)));
    }

    [Fact]
    public async Task Listar_busca_sin_acentos()
    {
        var pagina = await _servicio.ListarAsync(new FiltroLugaresRequest(Busqueda: "santa ROSA"));

        Assert.Equal(1, pagina.Total);
    }

    [Fact]
    public async Task Obtener_incluye_condiciones_de_acceso_y_abierto_ahora()
    {
        var ficha = await _servicio.ObtenerAsync(_datos.CenotePublicado.IdRecurso);

        Assert.Equal(50, ficha.CostoAcceso);
        Assert.Equal("Chaleco obligatorio", ficha.CondicionesAcceso);
        Assert.Equal("Camino a los cenotes", ficha.Ubicacion.DireccionReferencia);
        Assert.True(ficha.AbiertoAhora); // lunes 12:00, abre de 09:00 a 17:00
    }

    [Fact]
    public async Task Obtener_archivado_lanza_NoEncontrado()
    {
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerAsync(_datos.CenoteArchivado.IdRecurso));
    }
}
