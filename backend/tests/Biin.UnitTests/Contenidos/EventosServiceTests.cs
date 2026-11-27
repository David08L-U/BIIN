using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Contenidos;

public class EventosServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly RelojFijo _reloj = new(); // lunes 7 dic 2026, 12:00 en Yucatán
    private readonly DatosPrueba _datos;
    private readonly EventosService _servicio;

    public EventosServiceTests()
    {
        _datos = DatosPrueba.Sembrar(_db);
        _servicio = new EventosService(_db, _reloj);
    }

    [Fact]
    public async Task Sin_fechas_lista_proximos_en_orden_e_incluye_cancelados()
    {
        var pagina = await _servicio.ListarAsync(new FiltroEventosRequest());

        // La feria del 1 de diciembre ya terminó
        Assert.Equal(["Concierto en Mérida", "Vaquería en la plaza"], pagina.Items.Select(e => e.Titulo));
        Assert.Equal(EstadoEvento.Cancelado, pagina.Items[0].EstadoEvento);
    }

    [Fact]
    public async Task Filtra_por_dia_local_de_Yucatan()
    {
        // La vaquería es el sábado 12 a las 19:00 local (domingo 13 01:00 UTC)
        var sabado = new DateOnly(2026, 12, 12);
        var pagina = await _servicio.ListarAsync(new FiltroEventosRequest(Desde: sabado, Hasta: sabado));

        Assert.Equal("Vaquería en la plaza", Assert.Single(pagina.Items).Titulo);
    }

    [Fact]
    public async Task Con_fecha_desde_pasada_incluye_eventos_anteriores()
    {
        var pagina = await _servicio.ListarAsync(new FiltroEventosRequest(Desde: new DateOnly(2026, 12, 1)));

        Assert.Equal(3, pagina.Total);
        Assert.Equal("Feria de diciembre", pagina.Items[0].Titulo);
    }

    [Fact]
    public async Task Rango_invertido_lanza_ReglaNegocio()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.ListarAsync(
            new FiltroEventosRequest(Desde: new DateOnly(2026, 12, 10), Hasta: new DateOnly(2026, 12, 9))));
    }

    [Fact]
    public async Task Filtra_por_estado_localidad_y_texto()
    {
        var programados = await _servicio.ListarAsync(new FiltroEventosRequest(Estado: EstadoEvento.Programado));
        var enMerida = await _servicio.ListarAsync(new FiltroEventosRequest(IdLocalidad: _datos.LocMerida.IdLocalidad));
        var porTexto = await _servicio.ListarAsync(new FiltroEventosRequest(Busqueda: "VAQUERIA"));

        Assert.Equal("Vaquería en la plaza", Assert.Single(programados.Items).Titulo);
        Assert.Equal("Concierto en Mérida", Assert.Single(enMerida.Items).Titulo);
        Assert.Equal("Vaquería en la plaza", Assert.Single(porTexto.Items).Titulo);
    }

    [Fact]
    public async Task Obtener_devuelve_ficha_aunque_haya_pasado()
    {
        var ficha = await _servicio.ObtenerAsync(_datos.FeriaPasada.IdRecurso);

        Assert.Equal(EstadoEvento.Finalizado, ficha.EstadoEvento);
        Assert.Equal("Organización ficticia", ficha.ContactoOrganizador);
        Assert.Equal("Homún", ficha.Ubicacion.Localidad);
    }

    [Fact]
    public async Task Obtener_un_negocio_como_evento_lanza_NoEncontrado()
    {
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerAsync(_datos.CocinaHomun.IdRecurso));
    }

    [Fact]
    public async Task Listar_con_gps_filtra_por_radio_y_ordena_por_distancia()
    {
        // Desde Homún plaza: Vaquería está a ~0 km y Concierto en Mérida a ~43 km
        var enHomun = await _servicio.ListarAsync(new FiltroEventosRequest(
            Lat: 20.7392m,
            Lng: -89.2855m,
            RadioKm: 10));

        var unico = Assert.Single(enHomun.Items);
        Assert.Equal("Vaquería en la plaza", unico.Titulo);
        Assert.NotNull(unico.DistanciaKm);
        Assert.InRange(unico.DistanciaKm!.Value, 0, 0.1);

        var amplio = await _servicio.ListarAsync(new FiltroEventosRequest(
            Lat: 20.7392m,
            Lng: -89.2855m,
            RadioKm: 80));

        // Sin GPS el concierto en Mérida iba primero por fecha; con GPS la vaquería en Homún va primero por cercanía
        Assert.Equal(["Vaquería en la plaza", "Concierto en Mérida"], amplio.Items.Select(e => e.Titulo));
        Assert.True(amplio.Items[0].DistanciaKm < amplio.Items[1].DistanciaKm);
    }

    [Fact]
    public async Task Listar_con_parametros_gps_incompletos_lanza_ReglaNegocio()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ListarAsync(new FiltroEventosRequest(Lng: -89.2855m)));
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ListarAsync(new FiltroEventosRequest(RadioKm: 15)));
    }
}
