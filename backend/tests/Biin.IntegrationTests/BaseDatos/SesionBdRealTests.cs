using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Biin.Application.DTOs.Auth;
using Biin.Application.DTOs.Usuarios;

namespace Biin.IntegrationTests.BaseDatos;

[Collection(ColeccionBdReal.Nombre)]
/// <summary>CU-01 de punta a punta contra PostgreSQL: registro, login, perfil, contraseña y cierre.</summary>
public class SesionBdRealTests(BdRealFactory factory) : IClassFixture<BdRealFactory>
{
    [FactBd]
    public async Task Salud_reporta_base_de_datos_ok()
    {
        using var client = factory.CreateClient();

        var resp = await client.GetAsync("/api/salud");

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        Assert.Contains("\"baseDeDatos\":\"ok\"", await resp.Content.ReadAsStringAsync());
    }

    [FactBd]
    public async Task Registro_login_perfil_y_cambio_de_contrasena_contra_PostgreSQL()
    {
        using var client = factory.CreateClient();
        var correo = BdPruebas.CorreoUnico("sesion");

        var auth = await factory.RegistrarViajeroAsync(client, "Viajera de Prueba Ñandú", correo.ToUpperInvariant(), "Prueba1234");
        Assert.Equal(correo, auth.Usuario.Correo);
        Assert.Equal(["viajero"], auth.Usuario.Roles);

        // Con la cuenta creada, repetir el correo con otras mayúsculas responde 409
        var repetido = await client.PostAsJsonAsync("/api/auth/registro",
            new RegistroRequest("Otra", correo, "Prueba1234"));
        Assert.Equal(HttpStatusCode.Conflict, repetido.StatusCode);

        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(correo, "Prueba1234"));
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var token = (await login.Content.ReadFromJsonAsync<AuthResponse>())!.Token;

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var perfil = await client.GetFromJsonAsync<PerfilUsuarioDto>("/api/usuarios/perfil");
        Assert.Equal("Viajera de Prueba Ñandú", perfil!.Nombre);
        Assert.True(perfil.Activo);

        var cambio = await client.PutAsJsonAsync("/api/auth/contrasena",
            new CambiarContrasenaRequest("Prueba1234", "NuevaClave1234"));
        Assert.Equal(HttpStatusCode.NoContent, cambio.StatusCode);

        // El token anterior quedó revocado y la contraseña vieja ya no sirve
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/yo")).StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        var viejo = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(correo, "Prueba1234"));
        Assert.Equal(HttpStatusCode.Unauthorized, viejo.StatusCode);
        var nuevo = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(correo, "NuevaClave1234"));
        Assert.Equal(HttpStatusCode.OK, nuevo.StatusCode);
    }

    [FactBd]
    public async Task Sin_confirmar_el_correo_no_hay_cuenta_y_se_puede_regresar_a_corregir_contra_PostgreSQL()
    {
        using var client = factory.CreateClient();
        var correo = BdPruebas.CorreoUnico("confirmar");

        var registro = await client.PostAsJsonAsync("/api/auth/registro",
            new RegistroRequest("Viajero Sin Confirmar", correo, "Prueba1234"));
        Assert.Equal(HttpStatusCode.Accepted, registro.StatusCode);
        var pendiente = (await registro.Content.ReadFromJsonAsync<RegistroPendienteResponse>())!;
        Assert.Equal(correo, pendiente.Correo);
        var codigo = factory.Buzon.UltimoCodigo(correo);

        // Sin confirmar: no existe la cuenta y el login avisa qué falta
        await using (var db = BdPruebas.CrearContexto())
        {
            Assert.False(db.Usuarios.Any(u => u.Correo == correo));
            Assert.True(db.RegistrosPendientes.Any(r => r.Correo == correo));
        }
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(correo, "Prueba1234"));
        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
        Assert.Contains("confirmas tu correo", await login.Content.ReadAsStringAsync());

        // Regresa al formulario y corrige el nombre: no llega otro código y el primero sigue sirviendo
        var enviadosAntes = factory.Buzon.Enviados;
        var corregido = await client.PostAsJsonAsync("/api/auth/registro",
            new RegistroRequest("Viajero Corregido", correo, "Prueba1234"));
        Assert.Equal(HttpStatusCode.Accepted, corregido.StatusCode);
        Assert.Equal(enviadosAntes, factory.Buzon.Enviados);

        var malo = codigo == "000000" ? "111111" : "000000";
        var incorrecto = await client.PostAsJsonAsync("/api/auth/registro/verificar", new VerificarRegistroRequest(correo, malo));
        Assert.Equal(HttpStatusCode.BadRequest, incorrecto.StatusCode);

        var reenvioTemprano = await client.PostAsJsonAsync("/api/auth/registro/reenviar", new ReenviarCodigoRequest(correo));
        Assert.Equal(HttpStatusCode.BadRequest, reenvioTemprano.StatusCode);

        var verificar = await client.PostAsJsonAsync("/api/auth/registro/verificar", new VerificarRegistroRequest(correo, codigo));
        Assert.Equal(HttpStatusCode.Created, verificar.StatusCode);
        var auth = (await verificar.Content.ReadFromJsonAsync<AuthResponse>())!;
        Assert.Equal("Viajero Corregido", auth.Usuario.Nombre);

        await using (var db = BdPruebas.CrearContexto())
        {
            Assert.True(db.Usuarios.Any(u => u.Correo == correo));
            Assert.False(db.RegistrosPendientes.Any(r => r.Correo == correo));
        }
    }
}
