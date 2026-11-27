using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Transporte;

/// <summary>Pruebas del servicio de mapa de rutas (paradas ordenadas y polyline para Leaflet, RF03, CU-03).</summary>
public class MapaRutaServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly MapaRutaService _servicio;

    public MapaRutaServiceTests()
    {
        SembrarRutas();
        _servicio = new MapaRutaService(_db);
    }

    [Fact]
    public async Task ObtenerMapa_devuelve_paradas_y_puntos_recorrido_en_orden()
    {
        var mapa = await _servicio.ObtenerMapaAsync(50);

        Assert.Equal("DEMO-MER-IZA", mapa.Codigo);
        Assert.Equal([1, 2], mapa.Paradas.Select(p => p.Orden).ToList());
        Assert.Equal(["Mérida", "Izamal"], mapa.Paradas.Select(p => p.Localidad).ToList());
        Assert.True(mapa.Paradas[0].PermiteAbordar);
        Assert.False(mapa.Paradas[0].PermiteDescender);

        // Respeta los puntos detallados del trazo ordenados
        Assert.Equal([1, 2, 3], mapa.PuntosRecorrido.Select(pt => pt.Orden).ToList());
        Assert.Equal(20.9500m, mapa.PuntosRecorrido[1].Latitud);
    }

    [Fact]
    public async Task ObtenerMapa_usa_paradas_como_fallback_si_no_hay_puntos_recorrido()
    {
        var mapa = await _servicio.ObtenerMapaAsync(51);

        Assert.Equal(2, mapa.Paradas.Count);
        Assert.Equal(2, mapa.PuntosRecorrido.Count);
        Assert.Equal(mapa.Paradas[0].Latitud, mapa.PuntosRecorrido[0].Latitud);
        Assert.Equal(mapa.Paradas[1].Longitud, mapa.PuntosRecorrido[1].Longitud);
    }

    [Fact]
    public async Task ObtenerMapa_rechaza_id_invalido_y_oculta_rutas_inactivas_o_pendientes()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.ObtenerMapaAsync(0));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerMapaAsync(52));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerMapaAsync(53));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerMapaAsync(999));
    }

    private void SembrarRutas()
    {
        var munMer = new Municipio { IdMunicipio = 1, Codigo = "050", Nombre = "Mérida" };
        var munIza = new Municipio { IdMunicipio = 2, Codigo = "040", Nombre = "Izamal" };
        var locMer = new Localidad { IdLocalidad = 1, IdMunicipio = 1, Nombre = "Mérida", Municipio = munMer };
        var locIza = new Localidad { IdLocalidad = 2, IdMunicipio = 2, Nombre = "Izamal", Municipio = munIza };
        var ubMer = new Ubicacion { IdUbicacion = 1, IdLocalidad = 1, Localidad = locMer, DireccionReferencia = "Terminal Mérida", Latitud = 20.9647m, Longitud = -89.6194m };
        var ubIza = new Ubicacion { IdUbicacion = 2, IdLocalidad = 2, Localidad = locIza, DireccionReferencia = "Centro Izamal", Latitud = 20.9333m, Longitud = -89.0178m };

        var rConTrazo = new Ruta
        {
            IdRecurso = 50, Codigo = "DEMO-MER-IZA", Activa = true,
            Recurso = new Recurso { IdRecurso = 50, Tipo = TipoRecurso.Ruta, Titulo = "Mérida a Izamal", EstadoPublicacion = EstadoPublicacion.Publicado, ActualizadoEn = DateTime.UtcNow }
        };
        rConTrazo.Paradas.Add(new RutaParada { IdRuta = 50, Orden = 2, IdUbicacion = 2, Ubicacion = ubIza, PermiteAbordar = false, PermiteDescender = true, Ruta = rConTrazo });
        rConTrazo.Paradas.Add(new RutaParada { IdRuta = 50, Orden = 1, IdUbicacion = 1, Ubicacion = ubMer, PermiteAbordar = true, PermiteDescender = false, Ruta = rConTrazo });
        rConTrazo.Puntos.Add(new PuntoRecorrido { IdRuta = 50, Orden = 3, Latitud = 20.9333m, Longitud = -89.0178m, Ruta = rConTrazo });
        rConTrazo.Puntos.Add(new PuntoRecorrido { IdRuta = 50, Orden = 1, Latitud = 20.9647m, Longitud = -89.6194m, Ruta = rConTrazo });
        rConTrazo.Puntos.Add(new PuntoRecorrido { IdRuta = 50, Orden = 2, Latitud = 20.9500m, Longitud = -89.3000m, Ruta = rConTrazo });

        var rSinTrazo = new Ruta
        {
            IdRecurso = 51, Codigo = "DEMO-IZA-MER", Activa = true,
            Recurso = new Recurso { IdRecurso = 51, Tipo = TipoRecurso.Ruta, Titulo = "Izamal a Mérida", EstadoPublicacion = EstadoPublicacion.Publicado, ActualizadoEn = DateTime.UtcNow }
        };
        rSinTrazo.Paradas.Add(new RutaParada { IdRuta = 51, Orden = 1, IdUbicacion = 2, Ubicacion = ubIza, Ruta = rSinTrazo });
        rSinTrazo.Paradas.Add(new RutaParada { IdRuta = 51, Orden = 2, IdUbicacion = 1, Ubicacion = ubMer, Ruta = rSinTrazo });

        var rPendiente = new Ruta { IdRecurso = 52, Codigo = "PEN", Activa = true, Recurso = new Recurso { IdRecurso = 52, Tipo = TipoRecurso.Ruta, Titulo = "Pendiente", EstadoPublicacion = EstadoPublicacion.Pendiente } };
        var rInactiva = new Ruta { IdRecurso = 53, Codigo = "INA", Activa = false, Recurso = new Recurso { IdRecurso = 53, Tipo = TipoRecurso.Ruta, Titulo = "Inactiva", EstadoPublicacion = EstadoPublicacion.Publicado } };

        _db.RutasSet.Items.AddRange([rConTrazo, rSinTrazo, rPendiente, rInactiva]);
    }
}
