using Biin.Application.DTOs.Transporte;
using Biin.Application.Services;
using Biin.Domain.Exceptions;
using Biin.Domain.Vistas;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Transporte;

/// <summary>Pruebas de búsqueda de localidades y paradas cercanas por GPS (RF02, RNF05).</summary>
public class UbicacionesServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly UbicacionesService _servicio;

    public UbicacionesServiceTests()
    {
        DatosPrueba.Sembrar(_db);
        _db.Set<VParadaRuta>().Items.AddRange(
        [
            new VParadaRuta
            {
                IdRuta = 40, Codigo = "MER-HOM", Ruta = "Mérida a Homún", Orden = 1,
                PermiteAbordar = true, PermiteDescender = false,
                IdUbicacion = 3, DireccionReferencia = "Centro Mérida",
                Latitud = 20.9674m, Longitud = -89.6237m,
                IdLocalidad = 2, Localidad = "Mérida", IdMunicipio = 2, Municipio = "Mérida"
            },
            new VParadaRuta
            {
                IdRuta = 40, Codigo = "MER-HOM", Ruta = "Mérida a Homún", Orden = 2,
                PermiteAbordar = false, PermiteDescender = true, // solo descenso: no debe sugerirse como abordaje
                IdUbicacion = 1, DireccionReferencia = "Plaza Homún",
                Latitud = 20.7392m, Longitud = -89.2855m,
                IdLocalidad = 1, Localidad = "Homún", IdMunicipio = 1, Municipio = "Homún"
            },
            new VParadaRuta
            {
                IdRuta = 41, Codigo = "HOM-MER", Ruta = "Homún a Mérida", Orden = 1,
                PermiteAbordar = true, PermiteDescender = false,
                IdUbicacion = 1, DireccionReferencia = "Plaza Homún",
                Latitud = 20.7392m, Longitud = -89.2855m,
                IdLocalidad = 1, Localidad = "Homún", IdMunicipio = 1, Municipio = "Homún"
            }
        ]);
        _servicio = new UbicacionesService(_db);
    }

    [Fact]
    public async Task BuscarCercanas_devuelve_paradas_con_abordaje_y_localidades_ordenadas_por_distancia()
    {
        // Posición muy cercana a Homún (~0.5 km)
        var resp = await _servicio.BuscarCercanasAsync(
            new FiltroUbicacionesCercanasRequest(20.7350m, -89.2860m, RadioKm: 50, Limite: 10));

        // Homún aparece primero, Mérida después (~43 km)
        Assert.Equal(["Homún", "Mérida"], resp.LocalidadesCercanas.Select(l => l.Localidad).ToList());
        Assert.True(resp.LocalidadesCercanas[0].DistanciaKm < resp.LocalidadesCercanas[1].DistanciaKm);

        // Solo incluye paradas donde PermiteAbordar == true (excluye la parada 2 de MER-HOM)
        Assert.Equal(2, resp.ParadasAbordajeCercanas.Count);
        Assert.Equal("HOM-MER", resp.ParadasAbordajeCercanas[0].CodigoRuta);
        Assert.Equal("MER-HOM", resp.ParadasAbordajeCercanas[1].CodigoRuta);
    }

    [Fact]
    public async Task BuscarCercanas_filtra_por_radio_y_devuelve_vacio_si_el_usuario_esta_lejos()
    {
        // Radio de 5 km alrededor de Homún: excluye Mérida
        var soloHomun = await _servicio.BuscarCercanasAsync(
            new FiltroUbicacionesCercanasRequest(20.7392m, -89.2855m, RadioKm: 5));
        Assert.Single(soloHomun.LocalidadesCercanas);
        Assert.Single(soloHomun.ParadasAbordajeCercanas);

        // Usuario ubicado fuera de Yucatán (CDMX): no lanza 400, devuelve listas vacías
        var lejos = await _servicio.BuscarCercanasAsync(
            new FiltroUbicacionesCercanasRequest(19.4326m, -99.1332m, RadioKm: 20));
        Assert.Empty(lejos.LocalidadesCercanas);
        Assert.Empty(lejos.ParadasAbordajeCercanas);
    }

    [Fact]
    public async Task BuscarCercanas_valida_coordenadas_y_radio()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.BuscarCercanasAsync(new FiltroUbicacionesCercanasRequest(95m, -89m)));
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.BuscarCercanasAsync(new FiltroUbicacionesCercanasRequest(20.9m, -89.6m, RadioKm: 0.1)));
    }
}
