using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Biin.IntegrationTests.Auth;

/// <summary>Pruebas de integración HTTP para logout con revocación y cambio de contraseña (CU-01, RNF04).</summary>
public class AuthSesionEndpointsTests : IClassFixture<AuthSesionEndpointsTests.SesionFactory>
{
    private const string ClaveJwt = "clave-sesion-biin-con-al-menos-32-caracteres-seguros";
    private readonly SesionFactory _factory;
    private readonly JwtGeneradorToken _generador;

    public AuthSesionEndpointsTests(SesionFactory factory)
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

    [Fact]
    public async Task Logout_y_contrasena_sin_token_devuelven_401_ProblemDetails()
    {
        using var client = _factory.CreateClient();

        var respLogout = await client.PostAsync("/api/auth/logout", content: null);
        var respClave = await client.PutAsJsonAsync("/api/auth/contrasena", new
        {
            contrasenaActual = "Clave1234",
            contrasenaNueva = "ClaveNueva1234"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, respLogout.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, respClave.StatusCode);
        Assert.Equal("application/problem+json", respLogout.Content.Headers.ContentType?.MediaType);
        Assert.Equal("application/problem+json", respClave.Content.Headers.ContentType?.MediaType);
    }

    [Theory]
    [InlineData("12345")]
    [InlineData("1234567")]
    [InlineData("abcdef")]
    [InlineData("")]
    public async Task Verificar_registro_con_codigo_mal_formado_devuelve_400_sin_tocar_la_base(string codigo)
    {
        using var client = _factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/auth/registro/verificar", new { correo = "viajero@biin.test", codigo });

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Registro_y_reenvio_con_correo_invalido_devuelven_400()
    {
        using var client = _factory.CreateClient();

        var registro = await client.PostAsJsonAsync("/api/auth/registro",
            new { nombre = "Viajero", correo = "no-es-correo", contrasena = "Clave1234" });
        var reenvio = await client.PostAsJsonAsync("/api/auth/registro/reenviar", new { correo = "no-es-correo" });

        Assert.Equal(HttpStatusCode.BadRequest, registro.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, reenvio.StatusCode);
    }

    [Fact]
    public async Task Recuperacion_con_datos_invalidos_devuelve_400_sin_tocar_la_base()
    {
        using var client = _factory.CreateClient();

        var sol = await client.PostAsJsonAsync("/api/auth/recuperar-contrasena", new { correo = "invalido" });
        var conf = await client.PostAsJsonAsync("/api/auth/recuperar-contrasena/confirmar",
            new { correo = "ana@biin.test", codigo = "abc", contrasenaNueva = "corta" });

        Assert.Equal(HttpStatusCode.BadRequest, sol.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, conf.StatusCode);
    }

    [Fact]
    public async Task Logout_devuelve_204_e_invalida_el_mismo_token_en_la_siguiente_peticion()
    {
        var usuario = new Usuario { IdUsuario = 1, Nombre = "Viajero", Correo = "viajero@biin.test" };
        var (token, _) = _generador.Generar(usuario, [Roles.Viajero]);

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var respLogout = await client.PostAsync("/api/auth/logout", content: null);
        Assert.Equal(HttpStatusCode.NoContent, respLogout.StatusCode);

        // El mismo token ahora debe ser rechazado con 401 por revocación de jti
        var respPosterior = await client.PostAsync("/api/auth/logout", content: null);
        Assert.Equal(HttpStatusCode.Unauthorized, respPosterior.StatusCode);
        Assert.Equal("application/problem+json", respPosterior.Content.Headers.ContentType?.MediaType);

        var problem = await respPosterior.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("cerrada", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }

    public class SesionFactory : WebApplicationFactory<Program>
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
                // Mantiene la verificación real de revocación de jti sin depender de conexión a PostgreSQL
                services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, o =>
                {
                    o.Events.OnTokenValidated = context =>
                    {
                        var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                        if (!string.IsNullOrWhiteSpace(jti))
                        {
                            var revocacion = context.HttpContext.RequestServices.GetRequiredService<IRevocacionToken>();
                            if (revocacion.EstaRevocado(jti))
                                context.Fail(new Domain.Exceptions.NoAutenticadoException("La sesión fue cerrada. Inicia sesión nuevamente."));
                        }
                        return Task.CompletedTask;
                    };
                });
            });
        }
    }
}
