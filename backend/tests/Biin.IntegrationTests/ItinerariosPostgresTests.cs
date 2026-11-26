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
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace Biin.IntegrationTests;

public sealed class ItinerariosPostgresFactAttribute : FactAttribute
{
    public ItinerariosPostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("BIIN_TEST_CONNECTION_STRING")))
            Skip = "Configura BIIN_TEST_CONNECTION_STRING para ejecutar las pruebas de persistencia PostgreSQL.";
        else if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("BIIN_TEST_FIXTURE_CONNECTION_STRING")))
            Skip = "Configura BIIN_TEST_FIXTURE_CONNECTION_STRING con acceso de preparación solo a la base aislada.";
    }
}

public sealed class ItinerariosPostgresTests
{
    private const string ClavePrueba = "solo-para-pruebas-de-integracion-bi-in-2026";

    [ItinerariosPostgresFact]
    public async Task CrudQuedaAisladoPorCuentaYSobreviveAlReinicioDeLaApi()
    {
        var connectionString = Environment.GetEnvironmentVariable("BIIN_TEST_CONNECTION_STRING")!;
        var fixtureConnectionString = Environment.GetEnvironmentVariable("BIIN_TEST_FIXTURE_CONNECTION_STRING")!;
        var options = new DbContextOptionsBuilder<BiinDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;
        var fixtureOptions = new DbContextOptionsBuilder<BiinDbContext>()
            .UseNpgsql(fixtureConnectionString)
            .UseSnakeCaseNamingConvention()
            .Options;
        var usuarioA = NuevoUsuario("a");
        var usuarioB = NuevoUsuario("b");

        await using (var db = new BiinDbContext(fixtureOptions))
        {
            db.Usuarios.AddRange(usuarioA, usuarioB);
            await db.SaveChangesAsync();
            db.Itinerarios.Add(new Itinerario
            {
                IdUsuario = usuarioA.IdUsuario,
                Nombre = "Registro histórico sin borrador",
                Inicio = new DateOnly(2024, 3, 15),
                Fin = new DateOnly(2024, 3, 15)
            });
            await db.SaveChangesAsync();
        }

        try
        {
            var cuerpo = Request("ticul", ["taller-alfareria", "corredor-calzado"]);
            var fechaEsperada = FechaLocalMerida().AddDays(7);
            int idItinerario;
            await using (var db = new BiinDbContext(options))
            {
                await db.Database.OpenConnectionAsync();
                await using var command = db.Database.GetDbConnection().CreateCommand();
                command.CommandText = "SELECT current_user, r.rolsuper, r.rolcreatedb, r.rolcreaterole FROM pg_roles r WHERE r.rolname = current_user";
                await using var reader = await command.ExecuteReaderAsync();
                Assert.True(await reader.ReadAsync());
                Assert.Equal("biin_app", reader.GetString(0));
                Assert.False(reader.GetBoolean(1));
                Assert.False(reader.GetBoolean(2));
                Assert.False(reader.GetBoolean(3));
            }
            await using (var api = CrearApi(connectionString))
            using (var client = api.CreateClient())
            {
                Autenticar(client, usuarioA.IdUsuario);
                var crear = await client.PostAsJsonAsync("/api/itinerarios", cuerpo);
                if (crear.StatusCode != HttpStatusCode.Created)
                    throw new InvalidOperationException($"La creación devolvió {(int)crear.StatusCode}: {await crear.Content.ReadAsStringAsync()}");
                Assert.Equal(HttpStatusCode.Created, crear.StatusCode);
                using var creadoJson = JsonDocument.Parse(await crear.Content.ReadAsStringAsync());
                idItinerario = creadoJson.RootElement.GetProperty("idItinerario").GetInt32();
                Assert.Equal("ticul", creadoJson.RootElement.GetProperty("destino").GetString());
                Assert.Equal("taller-alfareria", creadoJson.RootElement.GetProperty("borrador").GetProperty("seleccion")[0].GetString());

                var listaInicial = await client.GetFromJsonAsync<JsonElement[]>("/api/itinerarios");
                Assert.NotNull(listaInicial);
                Assert.Single(listaInicial);
                Assert.Equal(idItinerario, listaInicial[0].GetProperty("idItinerario").GetInt32());

                var fechaPasada = Request("ticul", ["taller-alfareria"], FechaLocalMerida().AddDays(-1));
                Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/itinerarios", fechaPasada)).StatusCode);

                var anteriores = await client.GetFromJsonAsync<JsonElement[]>("/api/itinerarios/anteriores");
                Assert.NotNull(anteriores);
                var anterior = Assert.Single(anteriores);
                Assert.Equal("Registro histórico sin borrador", anterior.GetProperty("nombre").GetString());
                Assert.Equal("2024-03-15", anterior.GetProperty("inicio").GetString());
                Assert.Equal(0, anterior.GetProperty("actividadesRegistradas").GetInt32());
                Assert.False(anterior.TryGetProperty("borrador", out _));

                var duplicado = await client.PostAsJsonAsync("/api/itinerarios", cuerpo);
                Assert.Equal(HttpStatusCode.OK, duplicado.StatusCode);
                using var duplicadoJson = JsonDocument.Parse(await duplicado.Content.ReadAsStringAsync());
                Assert.Equal(idItinerario, duplicadoJson.RootElement.GetProperty("idItinerario").GetInt32());
            }

            // Una nueva instancia de API prueba persistencia tras reinicio; dos clientes prueban sesiones HTTP aisladas.
            await using (var apiReiniciada = CrearApi(connectionString))
            using (var propietario = apiReiniciada.CreateClient())
            using (var otraCuenta = apiReiniciada.CreateClient())
            {
                Autenticar(propietario, usuarioA.IdUsuario);
                Autenticar(otraCuenta, usuarioB.IdUsuario);
                var listaPersistida = await propietario.GetFromJsonAsync<JsonElement[]>("/api/itinerarios");
                Assert.NotNull(listaPersistida);
                Assert.Single(listaPersistida);
                Assert.Equal(idItinerario, listaPersistida[0].GetProperty("idItinerario").GetInt32());
                var reapertura = await propietario.GetAsync($"/api/itinerarios/{idItinerario}");
                Assert.Equal(HttpStatusCode.OK, reapertura.StatusCode);
                using var reaperturaJson = JsonDocument.Parse(await reapertura.Content.ReadAsStringAsync());
                Assert.Equal(fechaEsperada.ToString("yyyy-MM-dd"), reaperturaJson.RootElement.GetProperty("borrador").GetProperty("configuracion").GetProperty("fecha").GetString());
                Assert.Equal(new[] { "taller-alfareria", "corredor-calzado" },
                    reaperturaJson.RootElement.GetProperty("borrador").GetProperty("seleccion").EnumerateArray().Select(x => x.GetString()).ToArray());

                var listaAjena = await otraCuenta.GetFromJsonAsync<JsonElement[]>("/api/itinerarios");
                Assert.Empty(listaAjena!);
                Assert.Empty((await otraCuenta.GetFromJsonAsync<JsonElement[]>("/api/itinerarios/anteriores"))!);
                Assert.Equal(HttpStatusCode.NotFound, (await otraCuenta.GetAsync($"/api/itinerarios/{idItinerario}")).StatusCode);
                Assert.Equal(HttpStatusCode.NotFound, (await otraCuenta.PutAsJsonAsync($"/api/itinerarios/{idItinerario}", cuerpo)).StatusCode);
                Assert.Equal(HttpStatusCode.NotFound, (await otraCuenta.DeleteAsync($"/api/itinerarios/{idItinerario}")).StatusCode);

                var actualizado = await propietario.PutAsJsonAsync($"/api/itinerarios/{idItinerario}", Request("ticul", ["taller-alfareria"]));
                Assert.Equal(HttpStatusCode.OK, actualizado.StatusCode);
                using var actualizadoJson = JsonDocument.Parse(await actualizado.Content.ReadAsStringAsync());
                Assert.Equal(new[] { "taller-alfareria" }, actualizadoJson.RootElement.GetProperty("borrador").GetProperty("seleccion").EnumerateArray().Select(x => x.GetString()).ToArray());
                Assert.Equal(HttpStatusCode.NoContent, (await propietario.DeleteAsync($"/api/itinerarios/{idItinerario}")).StatusCode);
                Assert.Empty((await propietario.GetFromJsonAsync<JsonElement[]>("/api/itinerarios"))!);
                var anteriorConservado = await propietario.GetFromJsonAsync<JsonElement[]>("/api/itinerarios/anteriores");
                Assert.Single(anteriorConservado!);
            }
        }
        finally
        {
            await using var cleanup = new BiinDbContext(fixtureOptions);
            await cleanup.Usuarios.Where(x => x.IdUsuario == usuarioA.IdUsuario || x.IdUsuario == usuarioB.IdUsuario)
                .ExecuteDeleteAsync();
        }
    }

    private static object Request(string destino, string[] seleccion, DateOnly? fecha = null) => new
    {
        destino,
        zonaHoraria = "America/Merida",
        borrador = new
        {
            destino,
            modo = "personalizado",
            generado = true,
            configuracion = new { estancia = "tour-compras", fecha = (fecha ?? FechaLocalMerida().AddDays(7)).ToString("yyyy-MM-dd"), horaInicio = "09:00", minutosDisponibles = "240" },
            seleccion
        }
    };

    private static DateOnly FechaLocalMerida() => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("America/Merida")).DateTime);

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
            builder.UseSetting("ConnectionStrings:Biin", connectionString);
            builder.UseSetting("Jwt:Clave", ClavePrueba);
            builder.UseSetting("Jwt:Emisor", "biin-api");
            builder.UseSetting("Jwt:Audiencia", "biin-web");
            builder.ConfigureLogging(logging => logging.ClearProviders());
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
