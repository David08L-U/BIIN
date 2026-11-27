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

namespace Biin.IntegrationTests.Contenidos;

/// <summary>Pruebas HTTP para endpoints públicos y administrativos de recorridos sugeridos (CU-13, RF12, RNF04).</summary>
public class RecorridosEndpointsTests : IClassFixture<RecorridosEndpointsTests.RecorridosFactory>
{
    private const string ClaveJwt = "clave-recorridos-biin-con-al-menos-32-caracteres-seguros";
    private readonly RecorridosFactory _factory;
    private readonly JwtGeneradorToken _generador;

    public RecorridosEndpointsTests(RecorridosFactory factory)
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
    public async Task Detalle_publico_con_id_invalido_devuelve_400_sin_requerir_token()
    {
        using var client = _factory.CreateClient();

        var resp = await client.GetAsync("/api/recorridos/0");

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Endpoints_admin_de_recorridos_exigen_rol_administrador_y_validan_payload()
    {
        using var anonimo = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync("/api/admin/recorridos")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.PostAsync("/api/admin/recorridos/1/publicar", null)).StatusCode);

        using var viajero = ClienteConRoles(Roles.Viajero);
        Assert.Equal(HttpStatusCode.Forbidden, (await viajero.GetAsync("/api/admin/recorridos")).StatusCode);

        using var admin = ClienteConRoles(Roles.Viajero, Roles.Administrador);
        var respInvalido = await admin.PostAsJsonAsync("/api/admin/recorridos", new
        {
            titulo = "ab",
            idLocalidadBase = 0
        });
        Assert.Equal(HttpStatusCode.BadRequest, respInvalido.StatusCode);
    }

    private HttpClient ClienteConRoles(params string[] roles)
    {
        var usuario = new Usuario { IdUsuario = 1, Nombre = "Prueba", Correo = "prueba@biin.test" };
        var (token, _) = _generador.Generar(usuario, roles);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public class RecorridosFactory : WebApplicationFactory<Program>
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
