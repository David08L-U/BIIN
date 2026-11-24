using Biin.Application.DTOs.Admin;
using Biin.Application.Interfaces;
using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Admin;

public class AdminUsuariosServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly HashFalso _hash = new();
    private readonly AdminUsuariosService _servicio;

    public AdminUsuariosServiceTests()
    {
        SembrarCatalogos();
        _servicio = new AdminUsuariosService(_db, _hash, new BitacoraAdminService(_db));
    }

    [Fact]
    public async Task ListarRoles_devuelve_catalogo_ordenado()
    {
        var roles = await _servicio.ListarRolesAsync();

        Assert.Equal(["administrador", "colaborador", "operador", "viajero"], roles.Select(r => r.Nombre).ToList());
    }

    [Fact]
    public async Task ListarUsuarios_filtra_por_texto_rol_estado_y_pagina()
    {
        AgregarUsuario(1, "Admin Principal", "admin@biin.test", true, Roles.Viajero, Roles.Administrador);
        AgregarUsuario(2, "Carlos Chofer", "carlos@biin.test", true, Roles.Viajero, Roles.Operador);
        AgregarUsuario(3, "Lucía Inactiva", "lucia@biin.test", false, Roles.Viajero);

        var soloOperadores = await _servicio.ListarUsuariosAsync(new FiltroUsuariosRequest(Rol: "OPERADOR"));
        Assert.Single(soloOperadores.Items);
        Assert.Equal("carlos@biin.test", soloOperadores.Items[0].Correo);

        var soloInactivos = await _servicio.ListarUsuariosAsync(new FiltroUsuariosRequest(Activo: false));
        Assert.Single(soloInactivos.Items);
        Assert.Equal("lucia@biin.test", soloInactivos.Items[0].Correo);

        var porTexto = await _servicio.ListarUsuariosAsync(new FiltroUsuariosRequest(Busqueda: "chofer"));
        Assert.Single(porTexto.Items);
        Assert.Equal(2, porTexto.Items[0].IdUsuario);
    }

    [Fact]
    public async Task CrearUsuario_siempre_agrega_viajero_asigna_rutas_y_registra_bitacora_sin_contrasena()
    {
        AgregarUsuario(1, "Admin", "admin@biin.test", true, Roles.Viajero, Roles.Administrador);

        var creado = await _servicio.CrearUsuarioAsync(1, new CrearUsuarioAdminRequest(
            "  Chofer Nuevo  ",
            "  CHOFER@BIIN.TEST ",
            "Secreta1234",
            [Roles.Operador],
            [101]));

        Assert.Equal("Chofer Nuevo", creado.Nombre);
        Assert.Equal("chofer@biin.test", creado.Correo);
        Assert.Equal(["operador", "viajero"], creado.Roles);
        Assert.Single(creado.RutasOperadas);
        Assert.Equal("DEMO-MER-HOM", creado.RutasOperadas[0].Codigo);

        var registroBitacora = Assert.Single(_db.BitacoraAdminSet.Items);
        Assert.Equal(1, registroBitacora.IdUsuario);
        Assert.Equal(AccionesBitacora.Crear, registroBitacora.Accion);
        Assert.Equal("usuarios", registroBitacora.Tabla);
        Assert.Equal(creado.IdUsuario.ToString(), registroBitacora.IdRegistro);
        Assert.DoesNotContain("Secreta1234", registroBitacora.Detalle ?? string.Empty);
    }

    [Fact]
    public async Task CrearUsuario_rechaza_correo_duplicado_rol_inexistente_y_rutas_sin_rol_operador()
    {
        AgregarUsuario(1, "Admin", "admin@biin.test", true, Roles.Viajero, Roles.Administrador);

        await Assert.ThrowsAsync<ConflictoException>(() =>
            _servicio.CrearUsuarioAsync(1, new CrearUsuarioAdminRequest("Dup", "ADMIN@biin.test", "Clave1234", [Roles.Viajero])));

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CrearUsuarioAsync(1, new CrearUsuarioAdminRequest("Nuevo", "nuevo@biin.test", "Clave1234", ["superdios"])));

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CrearUsuarioAsync(1, new CrearUsuarioAdminRequest("Viajero", "v@biin.test", "Clave1234", [Roles.Viajero], [101])));

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CrearUsuarioAsync(1, new CrearUsuarioAdminRequest("Operador", "op@biin.test", "Clave1234", [Roles.Operador], [9999])));
    }

    [Fact]
    public async Task ActualizarRoles_protege_admin_y_limpia_operador_ruta_al_quitar_rol_operador()
    {
        AgregarUsuario(1, "Admin Uno", "admin1@biin.test", true, Roles.Viajero, Roles.Administrador);
        var operador = AgregarUsuario(2, "Operador", "op@biin.test", true, Roles.Viajero, Roles.Operador);
        var ruta = _db.RutasSet.Items.Single(r => r.IdRecurso == 101);
        operador.RutasOperadas.Add(new OperadorRuta { IdUsuario = 2, IdRuta = 101, Usuario = operador, Ruta = ruta });

        // Un admin no puede quitarse su propio rol administrador
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ActualizarRolesAsync(1, 1, new ActualizarRolesRequest([Roles.Viajero])));

        // Quitar rol operador limpia sus rutas asignadas y conserva viajero
        var actualizado = await _servicio.ActualizarRolesAsync(1, 2, new ActualizarRolesRequest([]));
        Assert.Equal([Roles.Viajero], actualizado.Roles);
        Assert.Empty(actualizado.RutasOperadas);
        Assert.DoesNotContain(_db.OperadorRutasSet.Items, or => or.IdUsuario == 2);

        var log = Assert.Single(_db.BitacoraAdminSet.Items);
        Assert.Equal(AccionesBitacora.Editar, log.Accion);
        Assert.Equal("usuario_rol", log.Tabla);
    }

    [Fact]
    public async Task ActualizarRoles_impide_dejar_cero_administradores_activos()
    {
        AgregarUsuario(1, "Admin Inactivo", "admin.inactivo@biin.test", false, Roles.Viajero, Roles.Administrador);
        AgregarUsuario(2, "Admin Activo", "admin.activo@biin.test", true, Roles.Viajero, Roles.Administrador);

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ActualizarRolesAsync(1, 2, new ActualizarRolesRequest([Roles.Viajero])));
    }

    [Fact]
    public async Task CambiarEstado_protege_admin_y_registra_archivar_y_editar()
    {
        AgregarUsuario(1, "Admin", "admin@biin.test", true, Roles.Viajero, Roles.Administrador);
        AgregarUsuario(2, "Viajero", "viajero@biin.test", true, Roles.Viajero);

        // No puede desactivarse a sí mismo
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CambiarEstadoAsync(1, 1, new CambiarEstadoUsuarioRequest(false)));

        var desactivado = await _servicio.CambiarEstadoAsync(1, 2, new CambiarEstadoUsuarioRequest(false));
        Assert.False(desactivado.Activo);
        Assert.Equal(AccionesBitacora.Archivar, _db.BitacoraAdminSet.Items[^1].Accion);

        var reactivado = await _servicio.CambiarEstadoAsync(1, 2, new CambiarEstadoUsuarioRequest(true));
        Assert.True(reactivado.Activo);
        Assert.Equal(AccionesBitacora.Editar, _db.BitacoraAdminSet.Items[^1].Accion);
    }

    [Fact]
    public async Task ActualizarRutasOperador_valida_rol_y_existencia_de_rutas()
    {
        AgregarUsuario(1, "Admin", "admin@biin.test", true, Roles.Viajero, Roles.Administrador);
        AgregarUsuario(2, "Viajero", "viajero@biin.test", true, Roles.Viajero);
        AgregarUsuario(3, "Operador", "op@biin.test", true, Roles.Viajero, Roles.Operador);

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ActualizarRutasOperadorAsync(1, 2, new ActualizarRutasOperadorRequest([101])));

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ActualizarRutasOperadorAsync(1, 3, new ActualizarRutasOperadorRequest([9999])));

        var actualizado = await _servicio.ActualizarRutasOperadorAsync(1, 3, new ActualizarRutasOperadorRequest([101, 102]));
        Assert.Equal([101, 102], actualizado.RutasOperadas.Select(r => r.IdRuta).OrderBy(x => x).ToList());
        Assert.Equal("operador_ruta", _db.BitacoraAdminSet.Items[^1].Tabla);
    }

    private void SembrarCatalogos()
    {
        _db.RolesSet.Items.AddRange(
        [
            new Rol { IdRol = 1, Nombre = Roles.Viajero },
            new Rol { IdRol = 2, Nombre = Roles.Colaborador },
            new Rol { IdRol = 3, Nombre = Roles.Operador },
            new Rol { IdRol = 4, Nombre = Roles.Administrador }
        ]);

        _db.RutasSet.Items.AddRange(
        [
            new Ruta { IdRecurso = 101, Codigo = "DEMO-MER-HOM", Activa = true, Recurso = new Recurso { IdRecurso = 101, Titulo = "Mérida - Homún" } },
            new Ruta { IdRecurso = 102, Codigo = "DEMO-HOM-MER", Activa = true, Recurso = new Recurso { IdRecurso = 102, Titulo = "Homún - Mérida" } }
        ]);
    }

    private Usuario AgregarUsuario(int id, string nombre, string correo, bool activo, params string[] roles)
    {
        var usuario = new Usuario
        {
            IdUsuario = id,
            Nombre = nombre,
            Correo = correo,
            HashContrasena = _hash.Generar("Clave1234"),
            Activo = activo,
            FechaRegistro = DateTime.UtcNow
        };
        foreach (var nombreRol in roles)
        {
            var rol = _db.RolesSet.Items.Single(r => r.Nombre == nombreRol);
            var enlace = new UsuarioRol { IdUsuario = id, IdRol = rol.IdRol, Usuario = usuario, Rol = rol };
            usuario.Roles.Add(enlace);
            _db.UsuarioRolesSet.Items.Add(enlace);
        }
        _db.UsuariosSet.Items.Add(usuario);
        return usuario;
    }
}
