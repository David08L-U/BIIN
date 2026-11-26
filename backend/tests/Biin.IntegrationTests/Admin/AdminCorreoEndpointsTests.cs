using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Biin.Application.DTOs.Admin;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Biin.IntegrationTests.Admin;

/// <summary>Pruebas HTTP para los endpoints administrativos de verificación SMTP (RF01, RNF04, RNF08).</summary>
public class AdminCorreoEndpointsTests : IClassFixture<AdminCorreoEndpointsTests.AdminCorreoFactory>
{
    private const string ClaveJwt = "clave-admin-correo-biin-con-al-menos-32-caracteres";
    private readonly AdminCorreoFactory _factory;
    private readonly JwtGeneradorToken _generador;

    public AdminCorreoEndpointsTests(AdminCorreoFactory factory)
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
    public async Task Sin_token_o_con_rol_viajero_rechaza_diagnostico_SMTP()
    {
        using var anonimo = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync("/api/admin/correo/estado")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await anonimo.PostAsJsonAsync("/api/admin/correo/prueba", new { correoDestino = "a@b.com" })).StatusCode);

        using var viajero = ClienteConRoles(Roles.Viajero);
        Assert.Equal(HttpStatusCode.Forbidden, (await viajero.GetAsync("/api/admin/correo/estado")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await viajero.PostAsJsonAsync("/api/admin/correo/prueba", new { correoDestino = "a@b.com" })).StatusCode);
    }

    [Fact]
    public async Task Administrador_consulta_estado_SMTP_y_recibe_503_si_intenta_enviar_sin_servidor()
    {
        using var admin = ClienteConRoles(Roles.Viajero, Roles.Administrador);

        var respEstado = await admin.GetAsync("/api/admin/correo/estado");
        Assert.Equal(HttpStatusCode.OK, respEstado.StatusCode);

        var estado = await respEstado.Content.ReadFromJsonAsync<EstadoCorreoDto>();
        Assert.NotNull(estado);
        Assert.False(estado.Configurado);
        Assert.Equal("desarrollo_log", estado.Modo);

        var respPrueba = await admin.PostAsJsonAsync("/api/admin/correo/prueba", new { correoDestino = "admin@biin.test" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, respPrueba.StatusCode);
    }

    private HttpClient ClienteConRoles(params string[] roles)
    {
        var usuario = new Usuario { IdUsuario = 1, Nombre = "Prueba", Correo = "prueba@biin.test" };
        var (token, _) = _generador.Generar(usuario, roles);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public class AdminCorreoFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Biin", "Host=localhost;Database=biin_test;Username=biin_app;Password=test");
            builder.UseSetting("Jwt:Clave", ClaveJwt);
            builder.UseSetting("Jwt:Emisor", "biin-api");
            builder.UseSetting("Jwt:Audiencia", "biin-web");
            builder.UseSetting("Correo:Servidor", "");

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
