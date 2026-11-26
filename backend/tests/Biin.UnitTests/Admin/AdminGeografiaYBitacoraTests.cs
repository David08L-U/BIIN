using Biin.Application.DTOs.Admin;
using Biin.Application.Interfaces;
using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Admin;

public class AdminGeografiaYBitacoraTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly DatosPrueba _d;
    private readonly AdminGeografiaService _geografia;
    private readonly BitacoraConsultaService _bitacora;

    public AdminGeografiaYBitacoraTests()
    {
        _d = DatosPrueba.Sembrar(_db);
        _geografia = new AdminGeografiaService(_db, new BitacoraAdminService(_db));
        _bitacora = new BitacoraConsultaService(_db);
    }

    [Fact]
    public async Task Crear_localidad_rechaza_duplicado_sin_acentos_y_municipio_inexistente()
    {
        var nueva = await _geografia.CrearLocalidadAsync(_d.Creador.IdUsuario, new CrearLocalidadRequest(_d.Homun.IdMunicipio, "San Isidro Ochil"));

        Assert.Equal("Homún", nueva.Municipio);
        await Assert.ThrowsAsync<ConflictoException>(() =>
            _geografia.CrearLocalidadAsync(_d.Creador.IdUsuario, new CrearLocalidadRequest(_d.Homun.IdMunicipio, "HOMUN")));
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _geografia.CrearLocalidadAsync(_d.Creador.IdUsuario, new CrearLocalidadRequest(999, "Otra")));
    }

    [Fact]
    public async Task Crear_ubicacion_redondea_a_seis_decimales_y_valida_rangos()
    {
        var ub = await _geografia.CrearUbicacionAsync(_d.Creador.IdUsuario,
            new CrearUbicacionRequest(_d.LocHomun.IdLocalidad, " Mercado ", 20.7391234567m, -89.2858765432m));

        Assert.Equal(20.739123m, ub.Latitud);
        Assert.Equal(-89.285877m, ub.Longitud);
        Assert.Equal("Mercado", ub.DireccionReferencia);
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _geografia.CrearUbicacionAsync(_d.Creador.IdUsuario,
            new CrearUbicacionRequest(_d.LocHomun.IdLocalidad, null, 95, -89)));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _geografia.CrearUbicacionAsync(_d.Creador.IdUsuario,
            new CrearUbicacionRequest(999, null, 20, -89)));
    }

    [Fact]
    public async Task Bitacora_se_lista_reciente_primero_y_filtra_por_accion_y_tabla()
    {
        _db.BitacoraAdminSet.Items.AddRange(
        [
            new BitacoraAdmin { IdBitacora = 1, IdUsuario = _d.Creador.IdUsuario, Usuario = _d.Creador, Accion = AccionesBitacora.Crear, Tabla = "negocios", IdRegistro = "10", Fecha = new DateTime(2026, 12, 1, 18, 0, 0, DateTimeKind.Utc) },
            new BitacoraAdmin { IdBitacora = 2, IdUsuario = _d.Creador.IdUsuario, Usuario = _d.Creador, Accion = AccionesBitacora.Publicar, Tabla = "recursos", IdRegistro = "10", Fecha = new DateTime(2026, 12, 2, 18, 0, 0, DateTimeKind.Utc) }
        ]);

        var todo = await _bitacora.ListarAsync(new FiltroBitacoraRequest());
        var publicar = await _bitacora.ListarAsync(new FiltroBitacoraRequest(Accion: "PUBLICAR"));
        var negocios = await _bitacora.ListarAsync(new FiltroBitacoraRequest(Tabla: "negocios"));
        var primeroDeDiciembre = await _bitacora.ListarAsync(new FiltroBitacoraRequest(Desde: new DateOnly(2026, 12, 1), Hasta: new DateOnly(2026, 12, 1)));

        Assert.Equal([2L, 1L], todo.Items.Select(b => b.IdBitacora));
        Assert.Equal("Equipo BIIN", todo.Items[0].Usuario);
        Assert.Equal(2, Assert.Single(publicar.Items).IdBitacora);
        Assert.Equal(1, Assert.Single(negocios.Items).IdBitacora);
        Assert.Equal(1, Assert.Single(primeroDeDiciembre.Items).IdBitacora);
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _bitacora.ListarAsync(new FiltroBitacoraRequest(Accion: "borrar_todo")));
    }
}
