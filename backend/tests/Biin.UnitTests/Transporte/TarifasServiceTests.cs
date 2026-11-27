using Biin.Application.DTOs.Transporte;
using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Transporte;

/// <summary>Pruebas de consulta pública de tarifas vigentes (RF03, RNF07, CU-03).</summary>
public class TarifasServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly RelojFijo _reloj = new(); // 2026-12-07 12:00 Yucatán
    private readonly TarifasService _servicio;

    public TarifasServiceTests()
    {
        SembrarRutaDemo();
        _servicio = new TarifasService(_db, _reloj);
    }

    [Fact]
    public async Task ObtenerVigentesPorRuta_devuelve_solo_vigentes_a_fecha_local_con_localidades_y_nota()
    {
        var resp = await _servicio.ObtenerVigentesPorRutaAsync(40);

        Assert.Equal("MER-HOM", resp.Codigo);
        Assert.Equal(new DateOnly(2026, 12, 7), resp.FechaConsulta);
        Assert.Contains("aproximadas", resp.NotaTarifa, StringComparison.OrdinalIgnoreCase);

        Assert.Equal(2, resp.Tarifas.Count);
        Assert.Equal((1, "Mérida", 2, "Acanceh", 25m),
            (resp.Tarifas[0].OrdenOrigen, resp.Tarifas[0].LocalidadOrigen, resp.Tarifas[0].OrdenDestino, resp.Tarifas[0].LocalidadDestino, resp.Tarifas[0].Monto));
        Assert.Equal((1, "Mérida", 3, "Homún", 45m),
            (resp.Tarifas[1].OrdenOrigen, resp.Tarifas[1].LocalidadOrigen, resp.Tarifas[1].OrdenDestino, resp.Tarifas[1].LocalidadDestino, resp.Tarifas[1].Monto));
    }

    [Fact]
    public async Task ObtenerVigentesPorRuta_filtra_por_tramo_y_por_fecha_futura()
    {
        var tramoActual = await _servicio.ObtenerVigentePorTramoAsync(40, 1, 3);
        Assert.NotNull(tramoActual);
        Assert.Equal(45m, tramoActual.Monto);

        // En enero 2027 entra la tarifa programada de 50 MXN
        var tramoFuturo = await _servicio.ObtenerVigentePorTramoAsync(40, 1, 3, new DateOnly(2027, 1, 15));
        Assert.NotNull(tramoFuturo);
        Assert.Equal(50m, tramoFuturo.Monto);
    }

    [Fact]
    public async Task ObtenerVigentesPorRuta_rechaza_tramo_invalido_y_oculta_rutas_inactivas_o_pendientes()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ObtenerVigentesPorRutaAsync(40, new FiltroTarifasRutaRequest(OrdenOrigen: 3, OrdenDestino: 1)));

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ObtenerVigentesPorRutaAsync(40, new FiltroTarifasRutaRequest(OrdenOrigen: 0)));

        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerVigentesPorRutaAsync(41));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerVigentesPorRutaAsync(42));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerVigentesPorRutaAsync(999));
    }

    private void SembrarRutaDemo()
    {
        var munMer = new Municipio { IdMunicipio = 1, Codigo = "050", Nombre = "Mérida" };
        var munAca = new Municipio { IdMunicipio = 2, Codigo = "002", Nombre = "Acanceh" };
        var munHom = new Municipio { IdMunicipio = 3, Codigo = "036", Nombre = "Homún" };

        var locMer = new Localidad { IdLocalidad = 1, IdMunicipio = 1, Nombre = "Mérida", Municipio = munMer };
        var locAca = new Localidad { IdLocalidad = 2, IdMunicipio = 2, Nombre = "Acanceh", Municipio = munAca };
        var locHom = new Localidad { IdLocalidad = 3, IdMunicipio = 3, Nombre = "Homún", Municipio = munHom };

        var ubMer = new Ubicacion { IdUbicacion = 1, IdLocalidad = 1, Localidad = locMer, DireccionReferencia = "Centro Mérida", Latitud = 20.9674m, Longitud = -89.6237m };
        var ubAca = new Ubicacion { IdUbicacion = 2, IdLocalidad = 2, Localidad = locAca, DireccionReferencia = "Centro Acanceh", Latitud = 20.8136m, Longitud = -89.4527m };
        var ubHom = new Ubicacion { IdUbicacion = 3, IdLocalidad = 3, Localidad = locHom, DireccionReferencia = "Plaza Homún", Latitud = 20.7390m, Longitud = -89.2858m };

        var recActiva = new Recurso { IdRecurso = 40, Tipo = TipoRecurso.Ruta, Titulo = "Mérida a Homún", EstadoPublicacion = EstadoPublicacion.Publicado, ActualizadoEn = _reloj.AhoraUtc };
        var rutaActiva = new Ruta { IdRecurso = 40, Codigo = "MER-HOM", Activa = true, Recurso = recActiva };
        rutaActiva.Paradas.Add(new RutaParada { IdRuta = 40, Orden = 1, IdUbicacion = 1, Ubicacion = ubMer, Ruta = rutaActiva });
        rutaActiva.Paradas.Add(new RutaParada { IdRuta = 40, Orden = 2, IdUbicacion = 2, Ubicacion = ubAca, Ruta = rutaActiva });
        rutaActiva.Paradas.Add(new RutaParada { IdRuta = 40, Orden = 3, IdUbicacion = 3, Ubicacion = ubHom, Ruta = rutaActiva });

        var recPendiente = new Recurso { IdRecurso = 41, Tipo = TipoRecurso.Ruta, Titulo = "Pendiente", EstadoPublicacion = EstadoPublicacion.Pendiente };
        var rutaPendiente = new Ruta { IdRecurso = 41, Codigo = "PEN-01", Activa = true, Recurso = recPendiente };

        var recInactiva = new Recurso { IdRecurso = 42, Tipo = TipoRecurso.Ruta, Titulo = "Inactiva", EstadoPublicacion = EstadoPublicacion.Publicado };
        var rutaInactiva = new Ruta { IdRecurso = 42, Codigo = "INA-01", Activa = false, Recurso = recInactiva };

        _db.RutasSet.Items.AddRange([rutaActiva, rutaPendiente, rutaInactiva]);
        _db.Set<Tarifa>().Items.AddRange(
        [
            // Vencida (no debe aparecer hoy)
            new Tarifa { IdTarifa = 1, IdRuta = 40, OrdenOrigen = 1, OrdenDestino = 3, Monto = 38m, VigenteDesde = new DateOnly(2025, 1, 1), VigenteHasta = new DateOnly(2025, 12, 31) },
            // Vigentes hoy
            new Tarifa { IdTarifa = 2, IdRuta = 40, OrdenOrigen = 1, OrdenDestino = 3, Monto = 45m, VigenteDesde = new DateOnly(2026, 1, 1), VigenteHasta = new DateOnly(2026, 12, 31) },
            new Tarifa { IdTarifa = 3, IdRuta = 40, OrdenOrigen = 1, OrdenDestino = 2, Monto = 25m, VigenteDesde = new DateOnly(2026, 1, 1), VigenteHasta = null },
            // Futura (solo aparece en 2027)
            new Tarifa { IdTarifa = 4, IdRuta = 40, OrdenOrigen = 1, OrdenDestino = 3, Monto = 50m, VigenteDesde = new DateOnly(2027, 1, 1), VigenteHasta = null }
        ]);
    }
}
