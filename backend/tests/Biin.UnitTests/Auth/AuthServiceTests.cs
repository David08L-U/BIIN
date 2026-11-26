using Biin.Application.DTOs.Auth;
using Biin.Application.Interfaces;
using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;
using Microsoft.Extensions.Options;

namespace Biin.UnitTests.Auth;

public class AuthServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly HashFalso _hash = new();
    private readonly GeneradorTokenFalso _tokens = new();
    private readonly RevocacionFalsa _revocacion = new();
    private readonly RelojFijo _reloj = new();
    private readonly CorreoFalso _correo = new();
    private readonly ValidadorDominioFalso _dominios = new();
    private readonly VerificacionCorreoOptions _opciones = new();
    private readonly AuthService _servicio;

    public AuthServiceTests()
    {
        _db.RolesSet.Items.AddRange(
        [
            new Rol { IdRol = 1, Nombre = Roles.Viajero },
            new Rol { IdRol = 2, Nombre = Roles.Operador },
            new Rol { IdRol = 3, Nombre = Roles.Administrador }
        ]);
        _servicio = new AuthService(_db, _hash, _tokens, _revocacion, _reloj, _correo, _dominios,
            Options.Create(_opciones));
    }

    [Fact]
    public async Task Registrar_no_crea_la_cuenta_y_manda_codigo_al_correo_normalizado()
    {
        var resp = await _servicio.RegistrarAsync(new RegistroRequest("  María Uc  ", "  MARIA@BIIN.TEST ", "Secreto123"));

        Assert.Empty(_db.UsuariosSet.Items);
        Assert.Equal("maria@biin.test", resp.Correo);
        Assert.Equal(_reloj.AhoraUtc.AddMinutes(15), resp.ExpiraEn);
        Assert.Equal(_reloj.AhoraUtc.AddSeconds(60), resp.ReenviarDesde);

        var enviado = Assert.Single(_correo.Enviados);
        Assert.Equal(("maria@biin.test", "María Uc"), (enviado.Correo, enviado.Nombre));
        Assert.Matches(@"^\d{6}$", enviado.Codigo);

        var pendiente = Assert.Single(_db.RegistrosPendientesSet.Items);
        Assert.True(_hash.Verificar("Secreto123", pendiente.HashContrasena));
        // Solo se guarda el hash del código, nunca el código
        Assert.NotEqual(enviado.Codigo, pendiente.HashCodigo);
        Assert.True(_hash.Verificar(enviado.Codigo, pendiente.HashCodigo));
    }

    [Fact]
    public async Task Registrar_rechaza_correo_duplicado_sin_importar_mayusculas()
    {
        AgregarUsuario(1, "Ana", "ana@biin.test", "Clave1234", true, Roles.Viajero);

        await Assert.ThrowsAsync<ConflictoException>(() =>
            _servicio.RegistrarAsync(new RegistroRequest("Otra Ana", "ANA@BIIN.TEST", "Clave1234")));
    }

    [Theory]
    [InlineData(" a ", "valido@biin.test", "Clave1234")]
    [InlineData("   ", "valido@biin.test", "Clave1234")]
    [InlineData("Nombre Válido", "valido@biin.test", "corta")]
    [InlineData("Nombre Válido", "valido@biin.test", "        ")]
    public async Task Registrar_rechaza_nombre_o_contrasena_invalidos(string nombre, string correo, string contrasena)
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.RegistrarAsync(new RegistroRequest(nombre, correo, contrasena)));
    }

    [Fact]
    public async Task Registrar_rechaza_contrasena_mayor_a_72_caracteres()
    {
        var larga = new string('A', 73);

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.RegistrarAsync(new RegistroRequest("Usuario", "larga@biin.test", larga)));
    }

    [Fact]
    public async Task Verificar_con_codigo_correcto_crea_solo_viajero_inicia_sesion_y_borra_el_pendiente()
    {
        var codigo = await RegistrarYLeerCodigoAsync("María Uc", "maria@biin.test", "Secreto123");

        var resp = await _servicio.VerificarRegistroAsync(new VerificarRegistroRequest("MARIA@biin.test", $" {codigo} "));

        Assert.Equal("María Uc", resp.Usuario.Nombre);
        Assert.Equal("maria@biin.test", resp.Usuario.Correo);
        Assert.Equal([Roles.Viajero], resp.Usuario.Roles);
        Assert.False(string.IsNullOrWhiteSpace(resp.Token));

        var guardado = Assert.Single(_db.UsuariosSet.Items);
        Assert.True(_hash.Verificar("Secreto123", guardado.HashContrasena));
        Assert.Equal(_reloj.AhoraUtc, guardado.FechaRegistro);
        Assert.Empty(_db.RegistrosPendientesSet.Items);
    }

    [Fact]
    public async Task Verificar_con_codigo_incorrecto_descuenta_intentos_y_al_agotarlos_anula_el_registro()
    {
        var codigo = await RegistrarYLeerCodigoAsync("Ana", "ana@biin.test", "Clave1234");
        var malo = codigo == "000000" ? "111111" : "000000";

        var primero = await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.VerificarRegistroAsync(new VerificarRegistroRequest("ana@biin.test", malo)));
        Assert.Contains("Te quedan 4 intentos", primero.Message);

        for (var i = 0; i < 3; i++)
            await Assert.ThrowsAsync<ReglaNegocioException>(() =>
                _servicio.VerificarRegistroAsync(new VerificarRegistroRequest("ana@biin.test", malo)));
        var ultimo = await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.VerificarRegistroAsync(new VerificarRegistroRequest("ana@biin.test", malo)));

        Assert.Contains("demasiadas veces", ultimo.Message);
        Assert.Empty(_db.RegistrosPendientesSet.Items);
        Assert.Empty(_db.UsuariosSet.Items);
        // Ya no sirve ni el código bueno: hay que registrarse otra vez
        await Assert.ThrowsAsync<NoEncontradoException>(() =>
            _servicio.VerificarRegistroAsync(new VerificarRegistroRequest("ana@biin.test", codigo)));
    }

    [Fact]
    public async Task Verificar_rechaza_codigo_vencido_y_anula_el_registro()
    {
        var codigo = await RegistrarYLeerCodigoAsync("Ana", "ana@biin.test", "Clave1234");
        _reloj.AhoraUtc = _reloj.AhoraUtc.AddMinutes(16);

        var ex = await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.VerificarRegistroAsync(new VerificarRegistroRequest("ana@biin.test", codigo)));

        Assert.Contains("venció", ex.Message);
        Assert.Empty(_db.RegistrosPendientesSet.Items);
        Assert.Empty(_db.UsuariosSet.Items);
    }

    [Fact]
    public async Task Verificar_sin_registro_pendiente_responde_no_encontrado()
    {
        await Assert.ThrowsAsync<NoEncontradoException>(() =>
            _servicio.VerificarRegistroAsync(new VerificarRegistroRequest("nadie@biin.test", "123456")));
    }

    [Fact]
    public async Task Verificar_falla_si_falta_rol_viajero_en_catalogo()
    {
        var codigo = await RegistrarYLeerCodigoAsync("Usuario", "nuevo@biin.test", "Clave1234");
        _db.RolesSet.Items.Clear();

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.VerificarRegistroAsync(new VerificarRegistroRequest("nuevo@biin.test", codigo)));
        Assert.Empty(_db.UsuariosSet.Items);
    }

    [Fact]
    public async Task IniciarSesion_devuelve_token_y_todos_los_roles_ordenados()
    {
        AgregarUsuario(1, "Operador", "op@biin.test", "Clave1234", true, Roles.Viajero, Roles.Operador);

        var resp = await _servicio.IniciarSesionAsync(new LoginRequest("  OP@BIIN.TEST ", "Clave1234"));

        Assert.Equal(1, resp.Usuario.IdUsuario);
        Assert.Equal([Roles.Operador, Roles.Viajero], resp.Usuario.Roles);
        Assert.False(string.IsNullOrWhiteSpace(resp.Token));
    }

    [Fact]
    public async Task IniciarSesion_usa_mismo_mensaje_para_correo_inexistente_y_contrasena_erronea()
    {
        AgregarUsuario(1, "Ana", "ana@biin.test", "Clave1234", true, Roles.Viajero);

        var exCorreo = await Assert.ThrowsAsync<NoAutenticadoException>(() =>
            _servicio.IniciarSesionAsync(new LoginRequest("nadie@biin.test", "Clave1234")));
        var exClave = await Assert.ThrowsAsync<NoAutenticadoException>(() =>
            _servicio.IniciarSesionAsync(new LoginRequest("ana@biin.test", "Incorrecta")));

        Assert.Equal(exCorreo.Message, exClave.Message);
    }

    [Fact]
    public async Task IniciarSesion_rechaza_cuenta_desactivada()
    {
        AgregarUsuario(1, "Inactivo", "inactivo@biin.test", "Clave1234", false, Roles.Viajero);

        var ex = await Assert.ThrowsAsync<NoAutenticadoException>(() =>
            _servicio.IniciarSesionAsync(new LoginRequest("inactivo@biin.test", "Clave1234")));

        Assert.Contains("desactivada", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ObtenerActual_devuelve_perfil_con_rutas_y_rechaza_inactivo_o_inexistente()
    {
        var operador = AgregarUsuario(1, "Chofer", "chofer@biin.test", "Clave1234", true, Roles.Viajero, Roles.Operador);
        var ruta = new Ruta
        {
            IdRecurso = 10,
            Codigo = "DEMO-MER-HOM",
            Activa = true,
            Recurso = new Recurso { IdRecurso = 10, Titulo = "Mérida - Homún" }
        };
        operador.RutasOperadas.Add(new OperadorRuta { IdUsuario = 1, IdRuta = 10, Usuario = operador, Ruta = ruta });
        AgregarUsuario(2, "Baja", "baja@biin.test", "Clave1234", false, Roles.Viajero);

        var perfil = await _servicio.ObtenerActualAsync(1);
        Assert.Equal("Chofer", perfil.Nombre);
        Assert.Single(perfil.RutasOperadas);
        Assert.Equal("DEMO-MER-HOM", perfil.RutasOperadas[0].Codigo);

        await Assert.ThrowsAsync<NoAutenticadoException>(() => _servicio.ObtenerActualAsync(2));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerActualAsync(999));
    }

    [Fact]
    public void CerrarSesion_revoca_jti_cuando_tiene_expiracion()
    {
        _servicio.CerrarSesion("jti-logout", DateTime.UtcNow.AddMinutes(30));

        Assert.Contains("jti-logout", _revocacion.Revocados);
    }

    [Fact]
    public async Task CambiarContrasena_actualiza_hash_y_revoca_token_previo()
    {
        var usuario = AgregarUsuario(1, "Ana", "ana@biin.test", "ClaveActual1", true, Roles.Viajero);

        await _servicio.CambiarContrasenaAsync(
            1,
            new CambiarContrasenaRequest("ClaveActual1", "ClaveNueva2"),
            "jti-actual",
            DateTime.UtcNow.AddMinutes(30));

        Assert.True(_hash.Verificar("ClaveNueva2", usuario.HashContrasena));
        Assert.False(_hash.Verificar("ClaveActual1", usuario.HashContrasena));
        Assert.Contains("jti-actual", _revocacion.Revocados);
    }

    [Fact]
    public async Task CambiarContrasena_valida_actual_igualdad_longitud_y_cuenta_activa()
    {
        var usuario = AgregarUsuario(1, "Ana", "ana@biin.test", "ClaveActual1", true, Roles.Viajero);
        AgregarUsuario(2, "Inactivo", "inactivo@biin.test", "ClaveActual1", false, Roles.Viajero);

        // Actual incorrecta
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CambiarContrasenaAsync(1, new CambiarContrasenaRequest("Equivocada", "ClaveNueva2"), "jti-1", DateTime.UtcNow.AddMinutes(10)));

        // Igual a la actual
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CambiarContrasenaAsync(1, new CambiarContrasenaRequest("ClaveActual1", "ClaveActual1"), "jti-1", DateTime.UtcNow.AddMinutes(10)));

        // Nueva muy corta
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CambiarContrasenaAsync(1, new CambiarContrasenaRequest("ClaveActual1", "corta"), "jti-1", DateTime.UtcNow.AddMinutes(10)));

        // Cuenta inactiva
        await Assert.ThrowsAsync<NoAutenticadoException>(() =>
            _servicio.CambiarContrasenaAsync(2, new CambiarContrasenaRequest("ClaveActual1", "ClaveNueva2"), "jti-2", DateTime.UtcNow.AddMinutes(10)));

        Assert.True(_hash.Verificar("ClaveActual1", usuario.HashContrasena));
        Assert.Empty(_revocacion.Revocados);
    }

    private async Task<string> RegistrarYLeerCodigoAsync(string nombre, string correo, string contrasena)
    {
        await _servicio.RegistrarAsync(new RegistroRequest(nombre, correo, contrasena));
        return _correo.UltimoCodigo(correo);
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

    private sealed class GeneradorTokenFalso : IGeneradorToken
    {
        public (string Token, DateTime ExpiraEn) Generar(Usuario usuario, IEnumerable<string> roles) =>
            ($"jwt-usuario-{usuario.IdUsuario}", DateTime.UtcNow.AddHours(2));
    }
}
