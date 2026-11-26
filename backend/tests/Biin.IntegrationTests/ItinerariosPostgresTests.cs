using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Biin.Domain.Entities;
using Biin.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace Biin.IntegrationTests;

public sealed class ItinerariosPostgresFactAttribute : FactAttribute
{
    public ItinerariosPostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("BIIN_TEST_CONNECTION_STRING")))
            Skip = "Configura BIIN_TEST_CONNECTION_STRING para ejecutar las pruebas de persistencia PostgreSQL.";
    }
}

public sealed class ItinerariosPostgresTests
{
    private const string ClavePrueba = "solo-para-pruebas-de-integracion-bi-in-2026";

    [ItinerariosPostgresFact]
    public async Task CrudQuedaAisladoPorCuentaYSobreviveAlReinicioDeLaApi()
    {
        var connectionString = Environment.GetEnvironmentVariable("BIIN_TEST_CONNECTION_STRING")!;
        var options = new DbContextOptionsBuilder<BiinDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;
        var usuarioA = NuevoUsuario("a");
        var usuarioB = NuevoUsuario("b");

        await using (var db = new BiinDbContext(options))
        {
            db.Usuarios.AddRange(usuarioA, usuarioB);
            await db.SaveChangesAsync();
        }

        try
        {
            var cuerpo = Request("ticul", ["taller-alfareria", "corredor-calzado"]);
            int idItinerario;
            await using (var api = CrearApi(connectionString))
            using (var client = api.CreateClient())
            {
                Autenticar(client, usuarioA.IdUsuario);
                var crear = await client.PostAsJsonAsync("/api/itinerarios", cuerpo);
                Assert.Equal(HttpStatusCode.Created, crear.StatusCode);
                using var creadoJson = JsonDocument.Parse(await crear.Content.ReadAsStringAsync());
                idItinerario = creadoJson.RootElement.GetProperty("idItinerario").GetInt32();
                Assert.Equal("ticul", creadoJson.RootElement.GetProperty("destino").GetString());
                Assert.Equal("taller-alfareria", creadoJson.RootElement.GetProperty("borrador").GetProperty("seleccion")[0].GetString());

                var duplicado = await client.PostAsJsonAsync("/api/itinerarios", cuerpo);
                Assert.Equal(HttpStatusCode.OK, duplicado.StatusCode);
                using var duplicadoJson = JsonDocument.Parse(await duplicado.Content.ReadAsStringAsync());
                Assert.Equal(idItinerario, duplicadoJson.RootElement.GetProperty("idItinerario").GetInt32());
            }

            // Una nueva instancia de API y cliente representa reinicio y otra sesión del navegador.
            await using (var apiReiniciada = CrearApi(connectionString))
            using (var propietario = apiReiniciada.CreateClient())
            using (var otraCuenta = apiReiniciada.CreateClient())
            {
                Autenticar(propietario, usuarioA.IdUsuario);
                Autenticar(otraCuenta, usuarioB.IdUsuario);
                var reapertura = await propietario.GetAsync($"/api/itinerarios/{idItinerario}");
                Assert.Equal(HttpStatusCode.OK, reapertura.StatusCode);
                using var reaperturaJson = JsonDocument.Parse(await reapertura.Content.ReadAsStringAsync());
                Assert.Equal("2026-12-02", reaperturaJson.RootElement.GetProperty("borrador").GetProperty("configuracion").GetProperty("fecha").GetString());
                Assert.Equal(new[] { "taller-alfareria", "corredor-calzado" },
                    reaperturaJson.RootElement.GetProperty("borrador").GetProperty("seleccion").EnumerateArray().Select(x => x.GetString()).ToArray());

                var listaAjena = await otraCuenta.GetFromJsonAsync<JsonElement[]>("/api/itinerarios");
                Assert.Empty(listaAjena!);
                Assert.Equal(HttpStatusCode.NotFound, (await otraCuenta.GetAsync($"/api/itinerarios/{idItinerario}")).StatusCode);
                Assert.Equal(HttpStatusCode.NotFound, (await otraCuenta.PutAsJsonAsync($"/api/itinerarios/{idItinerario}", cuerpo)).StatusCode);
                Assert.Equal(HttpStatusCode.NotFound, (await otraCuenta.DeleteAsync($"/api/itinerarios/{idItinerario}")).StatusCode);

                var actualizado = await propietario.PutAsJsonAsync($"/api/itinerarios/{idItinerario}", Request("ticul", ["taller-alfareria"]));
                Assert.Equal(HttpStatusCode.OK, actualizado.StatusCode);
                Assert.Equal(HttpStatusCode.NoContent, (await propietario.DeleteAsync($"/api/itinerarios/{idItinerario}")).StatusCode);
            }
        }
        finally
        {
            await using var cleanup = new BiinDbContext(options);
            await cleanup.Usuarios.Where(x => x.IdUsuario == usuarioA.IdUsuario || x.IdUsuario == usuarioB.IdUsuario)
                .ExecuteDeleteAsync();
        }
    }

    private static object Request(string destino, string[] seleccion) => new
    {
        destino,
        borrador = new
        {
            destino,
            modo = "personalizado",
            generado = true,
            configuracion = new { estancia = "tour-compras", fecha = "2026-12-02", horaInicio = "09:00", minutosDisponibles = "240" },
            seleccion
        }
    };

    private static Usuario NuevoUsuario(string sufijo) => new()
    {
        Nombre = "Cuenta de prueba",
        Correo = $"itinerarios-{Guid.NewGuid():N}-{sufijo}@example.test",
        HashContrasena = "hash-no-utilizable-en-integracion"
    };

    private static WebApplicationFactory<Program> CrearApi(string connectionString) => new TestApiFactory(connectionString);

    private static void Autenticar(HttpClient client, int idUsuario)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ClavePrueba));
        var token = new JwtSecurityToken("biin-api", "biin-web",
            [new Claim(JwtRegisteredClaimNames.Sub, idUsuario.ToString())],
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
    }

    private sealed class TestApiFactory(string connectionString) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Biin"] = connectionString,
                ["Jwt:Clave"] = ClavePrueba,
                ["Jwt:Emisor"] = "biin-api",
                ["Jwt:Audiencia"] = "biin-web"
            }));
        }
    }
}
