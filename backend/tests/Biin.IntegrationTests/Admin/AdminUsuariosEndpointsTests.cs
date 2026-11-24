using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Biin.IntegrationTests.Admin;

/// <summary>Comprueba que UsuariosController y AdminUsuariosController apliquen 401/403 en el backend (RNF04).</summary>
public class AdminUsuariosEndpointsTests : IClassFixture<AdminUsuariosEndpointsTests.EndpointsFactory>
{
    private const string ClaveJwt = "clave-endpoints-admin-biin-con-al-menos-32-caracteres";
    private readonly EndpointsFactory _factory;
    private readonly JwtGeneradorToken _generador;

    public AdminUsuariosEndpointsTests(EndpointsFactory factory)
    {
        _factory = factory;
        _generador = new JwtGeneradorToken(Options.Create(new JwtOptions
        {
            Emisor = "biin-api",
            Audiencia = "biin-web",
            Clave = ClaveJwt,
            MinutosExpiracion = 30
        }));
    }

    [Theory]
    [InlineData("GET", "/api/usuarios/perfil")]
    [InlineData("PUT", "/api/usuarios/perfil")]
    [InlineData("DELETE", "/api/usuarios/perfil")]
    [InlineData("GET", "/api/admin/roles")]
    [InlineData("GET", "/api/admin/usuarios")]
    [InlineData("GET", "/api/admin/usuarios/1")]
    [InlineData("POST", "/api/admin/usuarios")]
    [InlineData("PUT", "/api/admin/usuarios/1/roles")]
    [InlineData("PATCH", "/api/admin/usuarios/1/estado")]
    [InlineData("PUT", "/api/admin/usuarios/1/rutas")]
    public async Task Endpoints_protegidos_sin_token_devuelven_401(string metodo, string ruta)
    {
        using var client = _factory.CreateClient();
        using var req = new HttpRequestMessage(new HttpMethod(metodo), ruta);

        var resp = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
        Assert.Equal("application/problem+json", resp.Content.Headers.ContentType?.MediaType);
    }

    [Theory]
    [InlineData("GET", "/api/admin/roles", new[] { Roles.Viajero })]
    [InlineData("GET", "/api/admin/usuarios", new[] { Roles.Viajero })]
    [InlineData("GET", "/api/admin/usuarios/1", new[] { Roles.Viajero })]
    [InlineData("POST", "/api/admin/usuarios", new[] { Roles.Viajero })]
    [InlineData("PUT", "/api/admin/usuarios/1/roles", new[] { Roles.Viajero })]
    [InlineData("PATCH", "/api/admin/usuarios/1/estado", new[] { Roles.Viajero })]
    [InlineData("PUT", "/api/admin/usuarios/1/rutas", new[] { Roles.Viajero })]
    [InlineData("GET", "/api/admin/usuarios", new[] { Roles.Viajero, Roles.Operador })]
    [InlineData("PUT", "/api/admin/usuarios/1/roles", new[] { Roles.Viajero, Roles.Operador })]
    [InlineData("PATCH", "/api/admin/usuarios/1/estado", new[] { Roles.Viajero, Roles.Colaborador })]
    public async Task Endpoints_admin_rechazan_roles_no_administradores_con_403_ProblemDetails(
        string metodo,
        string ruta,
        string[] roles)
    {
        var usuario = new Usuario { IdUsuario = 2, Nombre = "No Admin", Correo = "noadmin@biin.test" };
        var (token, _) = _generador.Generar(usuario, roles);

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var req = new HttpRequestMessage(new HttpMethod(metodo), ruta);

        var resp = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
        Assert.Equal("application/problem+json", resp.Content.Headers.ContentType?.MediaType);

        var problem = await resp.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(403, problem.Status);
        Assert.Equal("Acceso denegado", problem.Title);
    }

    public class EndpointsFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Biin", "Host=localhost;Database=biin_test;Username=biin_app;Password=test");
            builder.UseSetting("Jwt:Clave", ClaveJwt);
            builder.UseSetting("Jwt:Emisor", "biin-api");
            builder.UseSetting("Jwt:Audiencia", "biin-web");

            builder.ConfigureServices(services =>
            {
                services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, o =>
                {
                    o.Events.OnTokenValidated = _ => Task.CompletedTask;
                });
            });
        }
    }
}
