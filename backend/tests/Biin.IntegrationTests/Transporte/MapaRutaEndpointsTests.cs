using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Biin.IntegrationTests.Transporte;

/// <summary>Pruebas HTTP del endpoint público de mapa de rutas (RF03, RF01).</summary>
public class MapaRutaEndpointsTests(MapaRutaEndpointsTests.MapaFactory factory)
    : IClassFixture<MapaRutaEndpointsTests.MapaFactory>
{
    [Fact]
    public async Task Id_invalido_devuelve_400_sin_requerir_autenticacion()
    {
        using var client = factory.CreateClient();

        var resp = await client.GetAsync("/api/rutas/0/mapa");

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    public class MapaFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Biin", "Host=localhost;Database=biin_test;Username=biin_app;Password=test");
            builder.UseSetting("Jwt:Clave", "clave-mapa-ruta-biin-con-al-menos-32-caracteres-seguros");
            builder.UseSetting("Jwt:Emisor", "biin-api");
            builder.UseSetting("Jwt:Audiencia", "biin-web");
        }
    }
}
