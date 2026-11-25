using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Interfaces;
using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Admin;

public class AdminContenidosServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly DatosPrueba _d;
    private readonly AdminContenidosService _servicio;
    private readonly Usuario _admin = new() { IdUsuario = 7, Nombre = "Admin BIIN", Correo = "admin@biin.test" };

    public AdminContenidosServiceTests()
    {
        _d = DatosPrueba.Sembrar(_db);
        _db.UsuariosSet.Items.Add(_admin);
        _servicio = new AdminContenidosService(_db, new BitacoraAdminService(_db), new RelojFijo());
    }

    private GuardarNegocioRequest Negocio(string titulo = "Loncheria La Esquina") =>
        new(titulo, "Tortas y salbutes", _d.UbHomun.IdUbicacion, "9991112233", 40, 120, [_d.ComidaRegional.IdCategoria]);

    private List<BitacoraAdmin> Bitacora => _db.BitacoraAdminSet.Items;

    [Fact]
    public async Task Crear_negocio_nace_pendiente_con_categorias_y_registra_bitacora()
    {
        var creado = await _servicio.CrearNegocioAsync(_admin.IdUsuario, Negocio());

        Assert.Equal(EstadoPublicacion.Pendiente, creado.EstadoPublicacion);
        Assert.Equal(TipoRecurso.Negocio, creado.Tipo);
        Assert.Equal("Admin BIIN", creado.Creador);
        Assert.Equal(["Comida regional"], creado.Categorias);
        Assert.Equal("Homún", creado.Localidad);
        var entrada = Assert.Single(Bitacora);
        Assert.Equal((AccionesBitacora.Crear, "negocios", creado.IdRecurso.ToString()), (entrada.Accion, entrada.Tabla, entrada.IdRegistro));
    }

    [Fact]
    public async Task Crear_valida_titulo_precios_ubicacion_y_categorias()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.CrearNegocioAsync(7, Negocio(" a ")));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.CrearNegocioAsync(7, Negocio() with { PrecioMinimoAprox = 200, PrecioMaximoAprox = 100 }));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.CrearNegocioAsync(7, Negocio() with { IdUbicacion = 999 }));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.CrearNegocioAsync(7, Negocio() with { IdCategorias = [999] }));
        Assert.Empty(Bitacora);
    }

    [Fact]
    public async Task Crear_evento_exige_zona_horaria_y_fin_posterior()
    {
        var inicio = new DateTime(2026, 12, 20, 1, 0, 0, DateTimeKind.Utc);
        var valido = new GuardarEventoRequest("Noche de trova", null, _d.UbHomun.IdUbicacion, inicio, inicio.AddHours(3), 50, "Casa de cultura");

        var creado = await _servicio.CrearEventoAsync(7, valido);

        Assert.Equal(TipoRecurso.Evento, creado.Tipo);
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.CrearEventoAsync(7, valido with { Fin = inicio.AddHours(-1) }));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.CrearEventoAsync(7,
            valido with { Inicio = DateTime.SpecifyKind(inicio, DateTimeKind.Unspecified) }));
    }

    [Fact]
    public async Task Editar_cambia_datos_y_categorias_y_deja_rastro()
    {
        var editado = await _servicio.ActualizarLugarAsync(7, _d.CenotePublicado.IdRecurso, new GuardarLugarRequest(
            "Cenote Santa Rosa (renovado)", "Nueva escalera", _d.UbHomunCenote.IdUbicacion, 80, "Chaleco y regadera", [_d.Cenote.IdCategoria, _d.Museo.IdCategoria]));

        Assert.Equal("Cenote Santa Rosa (renovado)", editado.Titulo);
        Assert.Equal(["Cenote", "Museo"], editado.Categorias);
        Assert.Equal(80, _d.CenotePublicado.Lugar!.CostoAcceso);
        Assert.Contains("Cenote Santa Rosa", Assert.Single(Bitacora).Detalle);
    }

    [Fact]
    public async Task Editar_con_tipo_equivocado_o_ruta_responde_NoEncontrado()
    {
        await Assert.ThrowsAsync<NoEncontradoException>(() =>
            _servicio.ActualizarNegocioAsync(7, _d.CenotePublicado.IdRecurso, Negocio()));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerAsync(_d.RutaMeridaHomun.IdRecurso));
    }

    [Fact]
    public async Task Publicar_registra_revisor_y_archivar_retira_sin_borrar()
    {
        var publicado = await _servicio.PublicarAsync(7, _d.NegocioPendiente.IdRecurso);
        Assert.Equal(EstadoPublicacion.Publicado, publicado.EstadoPublicacion);
        Assert.Equal("Admin BIIN", publicado.Revisor);
        Assert.NotNull(publicado.FechaRevision);
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.PublicarAsync(7, _d.NegocioPendiente.IdRecurso));

        var archivado = await _servicio.ArchivarAsync(7, _d.NegocioPendiente.IdRecurso);
        Assert.Equal(EstadoPublicacion.Archivado, archivado.EstadoPublicacion);
        Assert.Contains(_db.Set<Recurso>().Items, r => r.IdRecurso == _d.NegocioPendiente.IdRecurso);
        Assert.Equal([AccionesBitacora.Publicar, AccionesBitacora.Archivar], Bitacora.Select(b => b.Accion));
    }

    [Fact]
    public async Task Cancelar_evento_cambia_su_estado_y_solo_aplica_a_eventos()
    {
        var cancelado = await _servicio.CambiarEstadoEventoAsync(7, _d.Vaqueria.IdRecurso, new CambiarEstadoEventoRequest(EstadoEvento.Cancelado));

        Assert.Equal(EstadoEvento.Cancelado, _d.Vaqueria.Evento!.EstadoEvento);
        Assert.Equal(EstadoPublicacion.Publicado, cancelado.EstadoPublicacion);
        await Assert.ThrowsAsync<NoEncontradoException>(() =>
            _servicio.CambiarEstadoEventoAsync(7, _d.CocinaHomun.IdRecurso, new CambiarEstadoEventoRequest(EstadoEvento.Cancelado)));
    }

    [Fact]
    public async Task Reemplazar_horarios_solo_en_negocios_y_lugares_con_dias_validos()
    {
        await _servicio.ReemplazarHorariosAsync(7, _d.CocinaHomun.IdRecurso, new ReemplazarHorariosRequest(
            [new HorarioVisitaDto(0, new TimeOnly(9, 0), new TimeOnly(14, 0))]));

        var horario = Assert.Single(_d.CocinaHomun.HorariosVisita);
        Assert.Equal(0, horario.DiaSemana);
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.ReemplazarHorariosAsync(7, _d.Vaqueria.IdRecurso,
            new ReemplazarHorariosRequest([])));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.ReemplazarHorariosAsync(7, _d.CocinaHomun.IdRecurso,
            new ReemplazarHorariosRequest([new HorarioVisitaDto(7, new TimeOnly(9, 0), new TimeOnly(10, 0))])));
    }

    [Theory]
    [InlineData("https://cdn.biin.mx/fotos/cenote.jpg", true)]
    [InlineData("/fotos/cenote.jpg", true)]
    [InlineData("javascript:alert(1)", false)]
    [InlineData("//otro-sitio.com/foto.jpg", false)]
    [InlineData("ftp://servidor/foto.jpg", false)]
    public async Task Fotografias_solo_aceptan_http_o_rutas_del_sitio(string url, bool valida)
    {
        var accion = () => _servicio.AgregarFotografiaAsync(7, _d.CenotePublicado.IdRecurso, new AgregarFotografiaRequest(url, "Vista del cenote"));

        if (valida)
            await accion();
        else
            await Assert.ThrowsAsync<ReglaNegocioException>(accion);
    }

    [Fact]
    public async Task Fotografias_exigen_texto_alternativo_se_ordenan_y_se_pueden_quitar()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.AgregarFotografiaAsync(7, _d.CocinaHomun.IdRecurso,
            new AgregarFotografiaRequest("/fotos/x.jpg", "  ")));

        await _servicio.AgregarFotografiaAsync(7, _d.CocinaHomun.IdRecurso, new AgregarFotografiaRequest("/fotos/3.jpg", "Comedor"));
        var nueva = _d.CocinaHomun.Fotografias.Single(f => f.UrlArchivo == "/fotos/3.jpg");
        Assert.Equal(3, nueva.Orden);

        await _servicio.QuitarFotografiaAsync(7, _d.CocinaHomun.IdRecurso, nueva.IdFotografia);
        Assert.DoesNotContain(_d.CocinaHomun.Fotografias, f => f.IdFotografia == nueva.IdFotografia);
        Assert.Contains(Bitacora, b => b.Accion == AccionesBitacora.Eliminar && b.Tabla == "fotografias");
    }

    [Fact]
    public async Task Listar_incluye_todos_los_estados_y_filtra()
    {
        var todos = await _servicio.ListarAsync(new FiltroContenidosAdminRequest(Tamano: 100));
        var pendientes = await _servicio.ListarAsync(new FiltroContenidosAdminRequest(Estado: EstadoPublicacion.Pendiente));

        Assert.Equal(8, todos.Total); // 9 recursos menos la ruta
        Assert.Equal("Taquería sin revisar", Assert.Single(pendientes.Items).Titulo);
    }
}
