using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Biin.IntegrationTests.Auth;

/// <summary>Pruebas HTTP de contratos de perfil alineados con el frontend (CU-01, RNF04).</summary>
public class UsuariosEndpointsTests : IClassFixture<UsuariosEndpointsTests.UsuariosFactory>
{
    private const string ClaveJwt = "clave-usuarios-biin-con-al-menos-32-caracteres-seguros";
    private readonly UsuariosFactory _factory;
    private readonly JwtGeneradorToken _generador;

    public UsuariosEndpointsTests(UsuariosFactory factory)
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
    [InlineData("/api/usuarios/perfil")]
    [InlineData("/api/usuarios/perfil/resumen")]
    public async Task Endpoints_de_perfil_sin_token_devuelven_401_ProblemDetails(string ruta)
    {
        using var client = _factory.CreateClient();

        var resp = await client.GetAsync(ruta);

        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
        Assert.Equal("application/problem+json", resp.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Actualizar_perfil_con_datos_invalidos_devuelve_400()
    {
        var usuario = new Usuario { IdUsuario = 1, Nombre = "Ana", Correo = "ana@biin.test" };
        var (token, _) = _generador.Generar(usuario, [Roles.Viajero]);

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var resp = await client.PutAsJsonAsync("/api/usuarios/perfil", new { nombre = "A", correo = "no-correo" });

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    public class UsuariosFactory : WebApplicationFactory<Program>
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
