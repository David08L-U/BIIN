using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Contenidos;

public class NegociosServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly RelojFijo _reloj = new();
    private readonly DatosPrueba _datos;
    private readonly NegociosService _servicio;

    public NegociosServiceTests()
    {
        _datos = DatosPrueba.Sembrar(_db);
        _servicio = new NegociosService(_db, _reloj);
    }

    [Fact]
    public async Task Listar_devuelve_solo_publicados_ordenados_por_nombre()
    {
        var pagina = await _servicio.ListarAsync(new FiltroNegociosRequest());

        Assert.Equal(2, pagina.Total);
        Assert.Equal(["Cocina económica Doña Mary", "Marisquería del Centro"], pagina.Items.Select(n => n.Titulo));
        Assert.DoesNotContain(pagina.Items, n => n.IdRecurso == _datos.NegocioPendiente.IdRecurso);
    }

    [Fact]
    public async Task Listar_filtra_por_localidad_y_municipio()
    {
        var porLocalidad = await _servicio.ListarAsync(new FiltroNegociosRequest(IdLocalidad: _datos.LocHomun.IdLocalidad));
        var porMunicipio = await _servicio.ListarAsync(new FiltroNegociosRequest(IdMunicipio: _datos.Merida.IdMunicipio));

        Assert.Equal("Cocina económica Doña Mary", Assert.Single(porLocalidad.Items).Titulo);
        Assert.Equal("Marisquería del Centro", Assert.Single(porMunicipio.Items).Titulo);
    }

    [Theory]
    [InlineData("dona mary", 1)]
    [InlineData("MARISQUERIA", 1)]
    [InlineData("homun", 1)]     // por nombre de la localidad
    [InlineData("pizzeria", 0)]
    public async Task Listar_busca_sin_acentos_en_titulo_descripcion_y_localidad(string texto, int esperados)
    {
        var pagina = await _servicio.ListarAsync(new FiltroNegociosRequest(Busqueda: texto));

        Assert.Equal(esperados, pagina.Total);
    }

    [Fact]
    public async Task Listar_filtra_por_presupuesto_y_rechaza_negativos()
    {
        var baratos = await _servicio.ListarAsync(new FiltroNegociosRequest(PrecioMaximo: 100));

        Assert.Equal("Cocina económica Doña Mary", Assert.Single(baratos.Items).Titulo);
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ListarAsync(new FiltroNegociosRequest(PrecioMaximo: -1)));
    }

    [Fact]
    public async Task Listar_indica_abierto_ahora_y_null_sin_horarios()
    {
        // Lunes 12:00 en Yucatán: la cocina abre de 08:00 a 17:00; la marisquería no tiene horarios
        var pagina = await _servicio.ListarAsync(new FiltroNegociosRequest());

        Assert.True(pagina.Items.Single(n => n.Titulo.StartsWith("Cocina")).AbiertoAhora);
        Assert.Null(pagina.Items.Single(n => n.Titulo.StartsWith("Marisquería")).AbiertoAhora);

        _reloj.AhoraUtc = new DateTime(2026, 12, 8, 2, 0, 0, DateTimeKind.Utc); // lunes 20:00 local
        var noche = await _servicio.ListarAsync(new FiltroNegociosRequest());
        Assert.False(noche.Items.Single(n => n.Titulo.StartsWith("Cocina")).AbiertoAhora);
    }

    [Fact]
    public async Task Listar_pagina_y_limita_el_tamano()
    {
        var segunda = await _servicio.ListarAsync(new FiltroNegociosRequest(Pagina: 2, Tamano: 1));
        var enorme = await _servicio.ListarAsync(new FiltroNegociosRequest(Tamano: 5000));

        Assert.Equal("Marisquería del Centro", Assert.Single(segunda.Items).Titulo);
        Assert.Equal(2, segunda.Total);
        Assert.Equal(100, enorme.Tamano);
    }

    [Fact]
    public async Task Obtener_devuelve_ficha_completa_con_fotos_en_orden()
    {
        var ficha = await _servicio.ObtenerAsync(_datos.CocinaHomun.IdRecurso);

        Assert.Equal("Homún", ficha.Ubicacion.Localidad);
        Assert.Equal("Homún", ficha.Ubicacion.Municipio);
        Assert.Equal([1, 2], ficha.Fotografias.Select(f => f.Orden));
        Assert.Equal(6, ficha.Horarios.Count);
        Assert.Equal(1, ficha.Horarios[0].DiaSemana);
        Assert.Equal("Comida regional", Assert.Single(ficha.Categorias).Nombre);
        Assert.True(ficha.AbiertoAhora);
    }

    [Fact]
    public async Task Obtener_pendiente_o_inexistente_lanza_NoEncontrado()
    {
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerAsync(_datos.NegocioPendiente.IdRecurso));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerAsync(9999));
        // Un lugar publicado no es un negocio
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerAsync(_datos.CenotePublicado.IdRecurso));
    }
}
