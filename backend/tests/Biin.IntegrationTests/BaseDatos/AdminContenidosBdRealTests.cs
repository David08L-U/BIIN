using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Auth;
using Biin.Application.DTOs.Catalogos;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Domain.Enums;

namespace Biin.IntegrationTests.BaseDatos;

/// <summary>CU-12 de punta a punta contra PostgreSQL: del alta como pendiente a la publicación y el retiro.</summary>
[Collection(ColeccionBdReal.Nombre)]
public class AdminContenidosBdRealTests(BdRealFactory factory) : IClassFixture<BdRealFactory>
{
    private const string Contrasena = "AdminPrueba1234";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) }
    };

    private async Task<HttpClient> ClienteAsync(string correo)
    {
        var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(correo, Contrasena));
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var token = (await login.Content.ReadFromJsonAsync<AuthResponse>())!.Token;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static async Task<T> LeerAsync<T>(HttpResponseMessage resp)
    {
        Assert.True(resp.IsSuccessStatusCode, $"{(int)resp.StatusCode}: {await resp.Content.ReadAsStringAsync()}");
        return (await resp.Content.ReadFromJsonAsync<T>(Json))!;
    }

    [FactBd]
    public async Task Viajero_recibe_403_en_administracion()
    {
        using var client = factory.CreateClient();
        var token = (await factory.RegistrarViajeroAsync(
            client, "Viajero Curioso", BdPruebas.CorreoUnico("curioso"), Contrasena)).Token;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/admin/contenidos")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/admin/bitacora")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/admin/ubicaciones",
            new CrearUbicacionRequest(1, "x", 20, -89))).StatusCode);
    }

    [FactBd]
    public async Task Alta_publicacion_cancelacion_y_retiro_de_contenidos_contra_PostgreSQL()
    {
        using var admin = await ClienteAsync(await BdPruebas.CrearAdministradorAsync(Contrasena));
        using var publico = factory.CreateClient();

        // Geografía: localidad y ubicación nuevas en Homún
        var municipios = await LeerAsync<List<MunicipioDto>>(await publico.GetAsync("/api/catalogos/municipios"));
        var homun = municipios.Single(m => m.Nombre == "Homún");
        var localidad = await LeerAsync<LocalidadDto>(await admin.PostAsJsonAsync("/api/admin/localidades",
            new CrearLocalidadRequest(homun.IdMunicipio, $"{BdPruebas.MarcaGeografia} Comisaría {Guid.NewGuid():N}")));
        var ubicacion = await LeerAsync<UbicacionDto>(await admin.PostAsJsonAsync("/api/admin/ubicaciones",
            new CrearUbicacionRequest(localidad.IdLocalidad, $"{BdPruebas.MarcaGeografia} Junto al parque", 20.7401m, -89.2861m)));

        var categorias = await LeerAsync<List<CategoriaDto>>(await publico.GetAsync("/api/catalogos/categorias"));
        var comida = categorias.Single(c => c.Nombre == "Comida regional");

        // Negocio: nace pendiente y no se ve en público
        var negocio = await LeerAsync<ContenidoAdminDto>(await admin.PostAsJsonAsync("/api/admin/contenidos/negocios",
            new GuardarNegocioRequest("Lonchería de prueba", "Salbutes y panuchos", ubicacion.IdUbicacion, null, 30, 90, [comida.IdCategoria])));
        Assert.Equal(EstadoPublicacion.Pendiente, negocio.EstadoPublicacion);
        Assert.Equal(HttpStatusCode.NotFound, (await publico.GetAsync($"/api/negocios/{negocio.IdRecurso}")).StatusCode);

        // Horarios y foto (el trigger de horarios_visita acepta negocios)
        await LeerAsync<ContenidoAdminDto>(await admin.PutAsJsonAsync($"/api/admin/contenidos/{negocio.IdRecurso}/horarios",
            new ReemplazarHorariosRequest([new HorarioVisitaDto(6, new TimeOnly(8, 0), new TimeOnly(15, 0))])));
        await LeerAsync<ContenidoAdminDto>(await admin.PostAsJsonAsync($"/api/admin/contenidos/{negocio.IdRecurso}/fotografias",
            new AgregarFotografiaRequest("/fotos/pruebas/loncheria.jpg", "Fachada de la lonchería")));

        // Publicar: ya se ve en público con su horario y foto
        var publicado = await LeerAsync<ContenidoAdminDto>(await admin.PostAsync($"/api/admin/contenidos/{negocio.IdRecurso}/publicar", null));
        Assert.Equal(EstadoPublicacion.Publicado, publicado.EstadoPublicacion);
        Assert.Equal("Admin de Prueba", publicado.Revisor);
        var ficha = await LeerAsync<NegocioDetalleDto>(await publico.GetAsync($"/api/negocios/{negocio.IdRecurso}"));
        Assert.Equal(6, Assert.Single(ficha.Horarios).DiaSemana);
        Assert.Equal("Fachada de la lonchería", Assert.Single(ficha.Fotografias).TextoAlternativo);

        // Evento publicado y luego cancelado: el público ve el cambio (RF06)
        var inicio = DateTime.UtcNow.AddDays(3);
        var evento = await LeerAsync<ContenidoAdminDto>(await admin.PostAsJsonAsync("/api/admin/contenidos/eventos",
            new GuardarEventoRequest("Concierto de prueba", null, ubicacion.IdUbicacion, inicio, inicio.AddHours(2), 0, null)));
        await LeerAsync<ContenidoAdminDto>(await admin.PostAsync($"/api/admin/contenidos/{evento.IdRecurso}/publicar", null));
        await LeerAsync<ContenidoAdminDto>(await admin.PatchAsJsonAsync($"/api/admin/contenidos/eventos/{evento.IdRecurso}/estado",
            new CambiarEstadoEventoRequest(EstadoEvento.Cancelado), Json));
        var fichaEvento = await LeerAsync<EventoDetalleDto>(await publico.GetAsync($"/api/eventos/{evento.IdRecurso}"));
        Assert.Equal(EstadoEvento.Cancelado, fichaEvento.EstadoEvento);

        // Horarios en un evento: los rechaza el backend antes que el trigger
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PutAsJsonAsync($"/api/admin/contenidos/{evento.IdRecurso}/horarios",
            new ReemplazarHorariosRequest([]))).StatusCode);

        // Archivar: deja de verse sin borrarse
        await LeerAsync<ContenidoAdminDto>(await admin.PostAsync($"/api/admin/contenidos/{negocio.IdRecurso}/archivar", null));
        Assert.Equal(HttpStatusCode.NotFound, (await publico.GetAsync($"/api/negocios/{negocio.IdRecurso}")).StatusCode);
        var enAdmin = await LeerAsync<ContenidoAdminDto>(await admin.GetAsync($"/api/admin/contenidos/{negocio.IdRecurso}"));
        Assert.Equal(EstadoPublicacion.Archivado, enAdmin.EstadoPublicacion);

        // La bitácora guarda cada paso con su JSON
        var bitacora = await LeerAsync<PaginaResultado<BitacoraDto>>(await admin.GetAsync("/api/admin/bitacora?tamano=100"));
        var deEsteNegocio = bitacora.Items.Where(b => b.IdRegistro == negocio.IdRecurso.ToString()).Select(b => b.Accion).ToList();
        Assert.Contains("crear", deEsteNegocio);
        Assert.Contains("publicar", deEsteNegocio);
        Assert.Contains("archivar", deEsteNegocio);
        Assert.Contains(bitacora.Items, b => b.Tabla == "ubicaciones" && b.Detalle!.Contains("latitud", StringComparison.OrdinalIgnoreCase));
    }
}
