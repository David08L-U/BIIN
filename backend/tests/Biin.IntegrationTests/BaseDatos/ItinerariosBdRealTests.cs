using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Biin.Application.DTOs.Auth;
using Biin.Application.DTOs.Itinerarios;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Infrastructure.Security;
using Microsoft.Extensions.Options;

namespace Biin.IntegrationTests.BaseDatos;

/// <summary>CU-09 de punta a punta contra PostgreSQL con la demo de Homún.</summary>
public class ItinerariosBdRealTests(BdRealFactory factory) : IClassFixture<BdRealFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) }
    };

    private async Task<HttpClient> ClienteViajeroAsync()
    {
        var client = factory.CreateClient();
        var registro = await client.PostAsJsonAsync("/api/auth/registro",
            new RegistroRequest("Viajero Itinerarios", BdPruebas.CorreoUnico("itinerario"), "Prueba1234"));
        registro.EnsureSuccessStatusCode();
        var token = (await registro.Content.ReadFromJsonAsync<AuthResponse>())!.Token;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static async Task<int> IdDemoAsync(string titulo)
    {
        await using var db = BdPruebas.CrearContexto();
        return db.Recursos.Where(r => r.Titulo == titulo).Select(r => r.IdRecurso).Single();
    }

    private static async Task<ItinerarioDetalleDto> LeerAsync(HttpResponseMessage resp)
    {
        Assert.True(resp.IsSuccessStatusCode, $"{(int)resp.StatusCode}: {await resp.Content.ReadAsStringAsync()}");
        return (await resp.Content.ReadFromJsonAsync<ItinerarioDetalleDto>(Json))!;
    }

    [FactBd]
    public async Task Sin_token_responde_401_y_rol_sin_viajero_403()
    {
        using var anonimo = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync("/api/itinerarios")).StatusCode);

        // Token firmado correctamente pero solo con rol operador (sin viajero)
        var generador = new JwtGeneradorToken(Options.Create(new JwtOptions
        {
            Emisor = "biin-api", Audiencia = "biin-web", Clave = BdRealFactory.ClaveJwt, MinutosExpiracion = 5
        }));
        await using var db = BdPruebas.CrearContexto();
        var cualquiera = db.Usuarios.Where(u => u.Activo).OrderBy(u => u.IdUsuario).First();
        var (token, _) = generador.Generar(new Usuario { IdUsuario = cualquiera.IdUsuario, Nombre = "x", Correo = "x@x" }, [Roles.Operador]);
        anonimo.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        Assert.Equal(HttpStatusCode.Forbidden, (await anonimo.GetAsync("/api/itinerarios")).StatusCode);
    }

    [FactBd]
    public async Task Flujo_completo_con_traslados_advertencias_y_reorden_en_PostgreSQL()
    {
        using var client = await ClienteViajeroAsync();
        var idCenote = await IdDemoAsync("[DEMO] Cenote de prueba en Homún");
        var idCocina = await IdDemoAsync("[DEMO] Cocina económica de Homún");
        var idVaqueria = await IdDemoAsync("[DEMO] Vaquería en la plaza de Homún");
        var idPendiente = await IdDemoAsync("[DEMO] Cenote pendiente de revisión");

        var hoy = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-6));
        var creado = await LeerAsync(await client.PostAsJsonAsync("/api/itinerarios",
            new CrearItinerarioRequest("Semana en Homún", hoy, hoy.AddDays(6), 2000)));
        var id = creado.IdItinerario;

        // Mañana a las 10:00 y 13:00 en Yucatán (UTC−6)
        var manana = hoy.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc).AddHours(6);
        await LeerAsync(await client.PostAsJsonAsync($"/api/itinerarios/{id}/actividades",
            new AgregarActividadRequest(idCenote, manana.AddHours(10), manana.AddHours(12), "Llevar chaleco")));
        await LeerAsync(await client.PostAsJsonAsync($"/api/itinerarios/{id}/actividades",
            new AgregarActividadRequest(idCocina, manana.AddHours(11), manana.AddHours(13))));
        var conTres = await LeerAsync(await client.PostAsJsonAsync($"/api/itinerarios/{id}/actividades",
            new AgregarActividadRequest(idVaqueria)));

        Assert.Equal(3, conTres.Actividades.Count);
        Assert.NotNull(conTres.Actividades[1].TrasladoDesdeAnterior);
        Assert.Contains(conTres.Advertencias, a => a.Tipo == "conflicto_horario");
        Assert.Equal("Homún", conTres.Actividades[0].Localidad);

        // Contenido pendiente no se puede agregar
        var pendiente = await client.PostAsJsonAsync($"/api/itinerarios/{id}/actividades", new AgregarActividadRequest(idPendiente));
        Assert.Equal(HttpStatusCode.BadRequest, pendiente.StatusCode);

        // Invertir el orden completo: con un UNIQUE no diferible un intercambio directo chocaría
        var ids = conTres.Actividades.Select(a => a.IdActividad).Reverse().ToList();
        var reordenado = await LeerAsync(await client.PutAsJsonAsync($"/api/itinerarios/{id}/actividades/orden",
            new ReordenarActividadesRequest(ids)));
        Assert.Equal(ids, reordenado.Actividades.Select(a => a.IdActividad));
        Assert.Equal([1, 2, 3], reordenado.Actividades.Select(a => a.Orden));

        var lista = await client.GetFromJsonAsync<List<ItinerarioResumenDto>>("/api/itinerarios", Json);
        Assert.Equal(3, Assert.Single(lista!).TotalActividades);

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/itinerarios/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/itinerarios/{id}")).StatusCode);
    }

    [FactBd]
    public async Task Un_viajero_no_puede_ver_el_itinerario_de_otro()
    {
        using var duena = await ClienteViajeroAsync();
        using var otro = await ClienteViajeroAsync();
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        var creado = await LeerAsync(await duena.PostAsJsonAsync("/api/itinerarios",
            new CrearItinerarioRequest("Privado", hoy, hoy)));

        Assert.Equal(HttpStatusCode.NotFound, (await otro.GetAsync($"/api/itinerarios/{creado.IdItinerario}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otro.DeleteAsync($"/api/itinerarios/{creado.IdItinerario}")).StatusCode);
    }
}
