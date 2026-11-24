using Biin.Application.DTOs.Usuarios;
using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Usuarios;

public class UsuariosServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly HashFalso _hash = new();
    private readonly RevocacionFalsa _revocacion = new();
    private readonly UsuariosService _servicio;

    public UsuariosServiceTests()
    {
        _servicio = new UsuariosService(_db, _hash, _revocacion);
    }

    [Fact]
    public async Task ObtenerPerfil_devuelve_roles_y_rutas_operadas_ordenadas()
    {
        var usuario = AgregarUsuario(1, "Operador Uno", "operador@biin.test", "Clave1234", true, Roles.Operador, Roles.Viajero);
        var rutaB = new Ruta { IdRecurso = 20, Codigo = "DEMO-MER-HOM", Activa = true, Recurso = new Recurso { IdRecurso = 20, Titulo = "Mérida - Homún" } };
        var rutaA = new Ruta { IdRecurso = 10, Codigo = "DEMO-HOM-MER", Activa = true, Recurso = new Recurso { IdRecurso = 10, Titulo = "Homún - Mérida" } };
        usuario.RutasOperadas.Add(new OperadorRuta { IdUsuario = 1, IdRuta = 20, Usuario = usuario, Ruta = rutaB });
        usuario.RutasOperadas.Add(new OperadorRuta { IdUsuario = 1, IdRuta = 10, Usuario = usuario, Ruta = rutaA });

        var perfil = await _servicio.ObtenerPerfilAsync(1);

        Assert.Equal(1, perfil.IdUsuario);
        Assert.Equal(["operador", "viajero"], perfil.Roles);
        Assert.Equal(["DEMO-HOM-MER", "DEMO-MER-HOM"], perfil.RutasOperadas.Select(r => r.Codigo).ToList());
    }

    [Fact]
    public async Task ObtenerPerfil_cuenta_inactiva_lanza_NoAutenticado()
    {
        AgregarUsuario(1, "Inactivo", "inactivo@biin.test", "Clave1234", false, Roles.Viajero);

        await Assert.ThrowsAsync<NoAutenticadoException>(() => _servicio.ObtenerPerfilAsync(1));
    }

    [Fact]
    public async Task ActualizarPerfil_normaliza_datos_y_rechaza_correo_ajeno()
    {
        AgregarUsuario(1, "Ana", "ana@biin.test", "Clave1234", true, Roles.Viajero);
        AgregarUsuario(2, "Luis", "luis@biin.test", "Clave1234", true, Roles.Viajero);

        var actualizado = await _servicio.ActualizarPerfilAsync(1, new ActualizarPerfilRequest("  Ana López  ", "  ANA.LOPEZ@BIIN.TEST  "));
        Assert.Equal("Ana López", actualizado.Nombre);
        Assert.Equal("ana.lopez@biin.test", actualizado.Correo);

        await Assert.ThrowsAsync<ConflictoException>(() =>
            _servicio.ActualizarPerfilAsync(1, new ActualizarPerfilRequest("Ana López", "LUIS@biin.test")));
    }

    [Fact]
    public async Task DesactivarCuentaPropia_desactiva_y_revoca_token_con_contrasena_correcta()
    {
        var usuario = AgregarUsuario(1, "Viajero", "viajero@biin.test", "Clave1234", true, Roles.Viajero);

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.DesactivarCuentaPropiaAsync(1, new DesactivarCuentaRequest("Incorrecta"), "jti-1", DateTime.UtcNow.AddMinutes(30)));
        Assert.True(usuario.Activo);

        await _servicio.DesactivarCuentaPropiaAsync(1, new DesactivarCuentaRequest("Clave1234"), "jti-1", DateTime.UtcNow.AddMinutes(30));

        Assert.False(usuario.Activo);
        Assert.Contains("jti-1", _revocacion.Revocados);
    }

    [Fact]
    public async Task DesactivarCuentaPropia_impide_desactivar_al_ultimo_administrador_activo()
    {
        AgregarUsuario(1, "Admin Único", "admin@biin.test", "Clave1234", true, Roles.Viajero, Roles.Administrador);

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.DesactivarCuentaPropiaAsync(1, new DesactivarCuentaRequest("Clave1234"), "jti-admin", DateTime.UtcNow.AddMinutes(30)));

        // Al haber un segundo administrador activo, ya se permite
        AgregarUsuario(2, "Admin Dos", "admin2@biin.test", "Clave1234", true, Roles.Viajero, Roles.Administrador);
        await _servicio.DesactivarCuentaPropiaAsync(1, new DesactivarCuentaRequest("Clave1234"), "jti-admin", DateTime.UtcNow.AddMinutes(30));

        Assert.False(_db.UsuariosSet.Items.Single(u => u.IdUsuario == 1).Activo);
    }

    private Usuario AgregarUsuario(int id, string nombre, string correo, string contrasena, bool activo, params string[] roles)
    {
        var usuario = new Usuario
        {
            IdUsuario = id,
            Nombre = nombre,
            Correo = correo,
            HashContrasena = _hash.Generar(contrasena),
            Activo = activo,
            FechaRegistro = DateTime.UtcNow
        };
        foreach (var r in roles)
        {
            var rol = new Rol { IdRol = Math.Abs(r.GetHashCode()), Nombre = r };
            usuario.Roles.Add(new UsuarioRol { IdUsuario = id, IdRol = rol.IdRol, Usuario = usuario, Rol = rol });
        }
        _db.UsuariosSet.Items.Add(usuario);
        return usuario;
    }
}
