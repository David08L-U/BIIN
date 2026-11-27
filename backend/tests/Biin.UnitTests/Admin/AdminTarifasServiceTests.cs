using Biin.Application.DTOs.Admin;
using Biin.Application.Interfaces;
using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Admin;

/// <summary>Pruebas de administración de tarifas por tramo, vigencias y bitácora (RF12, CU-12, 17.1.5).</summary>
public class AdminTarifasServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly RelojFijo _reloj = new(); // 2026-12-07 Yucatán
    private readonly AdminTarifasService _servicio;

    public AdminTarifasServiceTests()
    {
        SembrarRuta();
        var bitacora = new BitacoraAdminService(_db);
        _servicio = new AdminTarifasService(_db, _reloj, bitacora);
    }

    [Fact]
    public async Task Crear_actualiza_y_cierra_vigencia_registrando_bitacora_y_permitiendo_tarifa_sucesiva()
    {
        var creada = await _servicio.CrearAsync(99, 10, new CrearTarifaRequest(
            OrdenOrigen: 1,
            OrdenDestino: 3,
            Monto: 45m,
            VigenteDesde: new DateOnly(2026, 1, 1)));

        Assert.True(creada.IdTarifa > 0);
        Assert.Equal("Mérida", creada.LocalidadOrigen);
        Assert.Equal("Izamal", creada.LocalidadDestino);
        Assert.Equal(45m, creada.Monto);
        Assert.True(creada.VigenteHoy);

        // Editar monto desde admin
        var editada = await _servicio.ActualizarAsync(99, 10, creada.IdTarifa, new ActualizarTarifaRequest(
            Monto: 50m,
            VigenteDesde: new DateOnly(2026, 1, 1)));
        Assert.Equal(50m, editada.Monto);

        // Cerrar vigencia actual al 31 dic 2026 sin borrar histórico
        var cerrada = await _servicio.CerrarVigenciaAsync(99, 10, creada.IdTarifa,
            new CerrarVigenciaTarifaRequest(new DateOnly(2026, 12, 31)));
        Assert.Equal(new DateOnly(2026, 12, 31), cerrada.VigenteHasta);

        // Ahora sí permite crear una nueva tarifa desde el 1 ene 2027
        var futura = await _servicio.CrearAsync(99, 10, new CrearTarifaRequest(
            OrdenOrigen: 1,
            OrdenDestino: 3,
            Monto: 55m,
            VigenteDesde: new DateOnly(2027, 1, 1)));
        Assert.False(futura.VigenteHoy);

        var todas = await _servicio.ListarPorRutaAsync(10, soloVigentes: false);
        var vigentes = await _servicio.ListarPorRutaAsync(10, soloVigentes: true);
        Assert.Equal(2, todas.Count);
        Assert.Single(vigentes);

        Assert.Equal(
            [AccionesBitacora.Crear, AccionesBitacora.Editar, AccionesBitacora.Archivar, AccionesBitacora.Crear],
            _db.BitacoraAdminSet.Items.Select(b => b.Accion).ToList());
    }

    [Fact]
    public async Task Crear_o_actualizar_con_vigencia_superpuesta_lanza_ConflictoException()
    {
        await _servicio.CrearAsync(99, 10, new CrearTarifaRequest(1, 3, 50m, new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31)));

        await Assert.ThrowsAsync<ConflictoException>(() =>
            _servicio.CrearAsync(99, 10, new CrearTarifaRequest(1, 3, 52m, new DateOnly(2026, 6, 1))));

        // Tramo distinto (1 -> 2) no tiene conflicto aunque comparta fechas
        var otroTramo = await _servicio.CrearAsync(99, 10, new CrearTarifaRequest(1, 2, 20m, new DateOnly(2026, 1, 1)));
        Assert.Equal(20m, otroTramo.Monto);

        // Segunda tarifa en 2027 no puede extender su inicio hacia 2026
        var futura = await _servicio.CrearAsync(99, 10, new CrearTarifaRequest(1, 3, 55m, new DateOnly(2027, 1, 1)));
        await Assert.ThrowsAsync<ConflictoException>(() =>
            _servicio.ActualizarAsync(99, 10, futura.IdTarifa, new ActualizarTarifaRequest(55m, new DateOnly(2026, 12, 31))));
    }

    [Fact]
    public async Task Valida_paradas_de_la_ruta_orden_monto_y_fechas()
    {
        // Orden inválido
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CrearAsync(99, 10, new CrearTarifaRequest(3, 1, 50m, new DateOnly(2026, 1, 1))));
        // Parada inexistente en la ruta
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CrearAsync(99, 10, new CrearTarifaRequest(1, 9, 50m, new DateOnly(2026, 1, 1))));
        // Monto negativo
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CrearAsync(99, 10, new CrearTarifaRequest(1, 3, -5m, new DateOnly(2026, 1, 1))));
        // Fin antes que inicio
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CrearAsync(99, 10, new CrearTarifaRequest(1, 3, 50m, new DateOnly(2026, 5, 10), new DateOnly(2026, 5, 1))));
        // Ruta inexistente
        await Assert.ThrowsAsync<NoEncontradoException>(() =>
            _servicio.ListarPorRutaAsync(999));
    }

    private void SembrarRuta()
    {
        var locMer = new Localidad { IdLocalidad = 1, Nombre = "Mérida" };
        var locHoctun = new Localidad { IdLocalidad = 2, Nombre = "Hoctún" };
        var locIzamal = new Localidad { IdLocalidad = 3, Nombre = "Izamal" };

        var ub1 = new Ubicacion { IdUbicacion = 1, IdLocalidad = 1, Localidad = locMer, DireccionReferencia = "Mérida" };
        var ub2 = new Ubicacion { IdUbicacion = 2, IdLocalidad = 2, Localidad = locHoctun, DireccionReferencia = "Hoctún" };
        var ub3 = new Ubicacion { IdUbicacion = 3, IdLocalidad = 3, Localidad = locIzamal, DireccionReferencia = "Izamal" };

        var recurso = new Recurso { IdRecurso = 10, Tipo = TipoRecurso.Ruta, Titulo = "Mérida a Izamal", EstadoPublicacion = EstadoPublicacion.Publicado };
        var ruta = new Ruta { IdRecurso = 10, Codigo = "DEMO-MER-IZA", Activa = true, Recurso = recurso };
        ruta.Paradas.Add(new RutaParada { IdRuta = 10, Orden = 1, IdUbicacion = 1, Ubicacion = ub1, Ruta = ruta });
        ruta.Paradas.Add(new RutaParada { IdRuta = 10, Orden = 2, IdUbicacion = 2, Ubicacion = ub2, Ruta = ruta });
        ruta.Paradas.Add(new RutaParada { IdRuta = 10, Orden = 3, IdUbicacion = 3, Ubicacion = ub3, Ruta = ruta });

        _db.RutasSet.Items.Add(ruta);
    }
}
