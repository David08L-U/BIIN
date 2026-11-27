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

namespace Biin.IntegrationTests.Admin;

/// <summary>Pruebas HTTP de permisos y validación para administración de tarifas (RF12, CU-12, RNF04).</summary>
public class AdminTarifasEndpointsTests : IClassFixture<AdminTarifasEndpointsTests.AdminTarifasFactory>
{
    private const string ClaveJwt = "clave-admin-tarifas-biin-con-al-menos-32-caracteres";
    private readonly AdminTarifasFactory _factory;
    private readonly JwtGeneradorToken _generador;

    public AdminTarifasEndpointsTests(AdminTarifasFactory factory)
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
    public async Task Sin_token_o_sin_rol_administrador_rechaza_gestion_de_tarifas()
    {
        using var anonimo = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync("/api/admin/rutas/1/tarifas")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await anonimo.PostAsJsonAsync("/api/admin/rutas/1/tarifas", new { ordenOrigen = 1, ordenDestino = 2, monto = 50, vigenteDesde = "2026-01-01" })).StatusCode);

        using var viajero = ClienteConRoles(Roles.Viajero);
        Assert.Equal(HttpStatusCode.Forbidden, (await viajero.GetAsync("/api/admin/rutas/1/tarifas")).StatusCode);

        using var operador = ClienteConRoles(Roles.Viajero, Roles.Operador);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await operador.PutAsJsonAsync("/api/admin/rutas/1/tarifas/1", new { monto = 55, vigenteDesde = "2026-01-01" })).StatusCode);
    }

    [Fact]
    public async Task Administrador_con_datos_invalidos_recibe_400_sin_tocar_bd()
    {
        using var admin = ClienteConRoles(Roles.Viajero, Roles.Administrador);

        var respMontoNegativo = await admin.PostAsJsonAsync("/api/admin/rutas/1/tarifas", new
        {
            ordenOrigen = 1,
            ordenDestino = 2,
            monto = -10,
            vigenteDesde = "2026-01-01"
        });
        var respOrdenInvalido = await admin.PostAsJsonAsync("/api/admin/rutas/1/tarifas", new
        {
            ordenOrigen = 3,
            ordenDestino = 1,
            monto = 50,
            vigenteDesde = "2026-01-01"
        });

        Assert.Equal(HttpStatusCode.BadRequest, respMontoNegativo.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, respOrdenInvalido.StatusCode);
    }

    private HttpClient ClienteConRoles(params string[] roles)
    {
        var usuario = new Usuario { IdUsuario = 1, Nombre = "Prueba", Correo = "prueba@biin.test" };
        var (token, _) = _generador.Generar(usuario, roles);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public class AdminTarifasFactory : WebApplicationFactory<Program>
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
