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

/// <summary>Pruebas HTTP de permisos y validación para edición de geografía (RF12, CU-12, RNF04).</summary>
public class AdminGeografiaEndpointsTests : IClassFixture<AdminGeografiaEndpointsTests.AdminGeoFactory>
{
    private const string ClaveJwt = "clave-admin-geografia-biin-con-al-menos-32-caracteres";
    private readonly AdminGeoFactory _factory;
    private readonly JwtGeneradorToken _generador;

    public AdminGeografiaEndpointsTests(AdminGeoFactory factory)
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
    public async Task Edicion_de_localidades_y_ubicaciones_exige_rol_administrador()
    {
        using var anonimo = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await anonimo.PutAsJsonAsync("/api/admin/localidades/1", new { idMunicipio = 1, nombre = "Homún" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await anonimo.PutAsJsonAsync("/api/admin/ubicaciones/1", new { idLocalidad = 1, direccionReferencia = "Plaza", latitud = 20.74, longitud = -89.28 })).StatusCode);

        using var viajero = ClienteConRoles(Roles.Viajero);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await viajero.PutAsJsonAsync("/api/admin/localidades/1", new { idMunicipio = 1, nombre = "Homún" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await viajero.PutAsJsonAsync("/api/admin/ubicaciones/1", new { idLocalidad = 1, direccionReferencia = "Plaza", latitud = 20.74, longitud = -89.28 })).StatusCode);
    }

    [Fact]
    public async Task Administrador_con_coordenadas_fuera_de_Yucatan_recibe_400_sin_tocar_bd()
    {
        using var admin = ClienteConRoles(Roles.Viajero, Roles.Administrador);

        var resp = await admin.PutAsJsonAsync("/api/admin/ubicaciones/1", new
        {
            idLocalidad = 1,
            direccionReferencia = "Coordenadas invertidas",
            latitud = -89.28,
            longitud = 20.74
        });

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    private HttpClient ClienteConRoles(params string[] roles)
    {
        var usuario = new Usuario { IdUsuario = 1, Nombre = "Prueba", Correo = "prueba@biin.test" };
        var (token, _) = _generador.Generar(usuario, roles);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public class AdminGeoFactory : WebApplicationFactory<Program>
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
