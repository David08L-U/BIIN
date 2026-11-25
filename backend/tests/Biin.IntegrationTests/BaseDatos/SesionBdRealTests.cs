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

        var registro = await client.PostAsJsonAsync("/api/auth/registro",
            new RegistroRequest("Viajera de Prueba Ñandú", correo.ToUpperInvariant(), "Prueba1234"));
        Assert.Equal(HttpStatusCode.Created, registro.StatusCode);
        var auth = (await registro.Content.ReadFromJsonAsync<AuthResponse>())!;
        Assert.Equal(correo, auth.Usuario.Correo);
        Assert.Equal(["viajero"], auth.Usuario.Roles);

        // El índice único lower(correo) impide repetir la cuenta con otras mayúsculas
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
}
