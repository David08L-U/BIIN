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

namespace Biin.IntegrationTests.Itinerarios;

/// <summary>Pruebas HTTP de autorización y validación para /api/itinerarios (CU-09, CU-13, RF09, RNF04).</summary>
public class ItinerariosEndpointsTests : IClassFixture<ItinerariosEndpointsTests.ItinerariosFactory>
{
    private const string ClaveJwt = "clave-itinerarios-biin-con-al-menos-32-caracteres-seguros";
    private readonly ItinerariosFactory _factory;
    private readonly JwtGeneradorToken _generador;

    public ItinerariosEndpointsTests(ItinerariosFactory factory)
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
    public async Task Endpoints_de_itinerarios_exigen_sesion_y_rol_viajero()
    {
        using var anonimo = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync("/api/itinerarios")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.PostAsJsonAsync(
            "/api/itinerarios/desde-recorrido/1", new { inicio = "2026-12-12" })).StatusCode);

        using var operador = ClienteConRoles(Roles.Operador);
        Assert.Equal(HttpStatusCode.Forbidden, (await operador.GetAsync("/api/itinerarios")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await operador.PostAsJsonAsync(
            "/api/itinerarios/desde-recorrido/1", new { inicio = "2026-12-12" })).StatusCode);
    }

    [Fact]
    public async Task Crear_y_crear_desde_recorrido_validan_payload_e_identificador()
    {
        using var viajero = ClienteConRoles(Roles.Viajero);

        var nombreCorto = await viajero.PostAsJsonAsync("/api/itinerarios", new
        {
            nombre = "A",
            inicio = "2026-12-12",
            fin = "2026-12-13"
        });
        Assert.Equal(HttpStatusCode.BadRequest, nombreCorto.StatusCode);

        var idInvalido = await viajero.PostAsJsonAsync("/api/itinerarios/desde-recorrido/0", new
        {
            inicio = "2026-12-12"
        });
        Assert.Equal(HttpStatusCode.BadRequest, idInvalido.StatusCode);

        var presupuestoNegativo = await viajero.PostAsJsonAsync("/api/itinerarios/desde-recorrido/1", new
        {
            inicio = "2026-12-12",
            presupuestoEstimado = -50
        });
        Assert.Equal(HttpStatusCode.BadRequest, presupuestoNegativo.StatusCode);
    }

    private HttpClient ClienteConRoles(params string[] roles)
    {
        var usuario = new Usuario { IdUsuario = 1, Nombre = "Viajero", Correo = "viajero@biin.test" };
        var (token, _) = _generador.Generar(usuario, roles);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public class ItinerariosFactory : WebApplicationFactory<Program>
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
