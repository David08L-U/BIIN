using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Biin.IntegrationTests.Transporte;

/// <summary>Pruebas HTTP del endpoint público de ubicaciones cercanas (RF02, RNF05).</summary>
public class UbicacionesEndpointsTests(UbicacionesEndpointsTests.UbicacionesFactory factory)
    : IClassFixture<UbicacionesEndpointsTests.UbicacionesFactory>
{
    [Theory]
    [InlineData("/api/ubicaciones/cercanas?lat=95&lng=-89.6")]
    [InlineData("/api/ubicaciones/cercanas?lat=20.9&lng=-190")]
    [InlineData("/api/ubicaciones/cercanas?lat=20.9&lng=-89.6&radioKm=0.1")]
    [InlineData("/api/ubicaciones/cercanas?lat=20.9&lng=-89.6&radioKm=500")]
    public async Task Coordenadas_o_radio_invalidos_devuelven_400_sin_requerir_sesion(string ruta)
    {
        using var client = factory.CreateClient();

        var resp = await client.GetAsync(ruta);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    public class UbicacionesFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Biin", "Host=localhost;Database=biin_test;Username=biin_app;Password=test");
            builder.UseSetting("Jwt:Clave", "clave-ubicaciones-biin-con-al-menos-32-caracteres");
            builder.UseSetting("Jwt:Emisor", "biin-api");
            builder.UseSetting("Jwt:Audiencia", "biin-web");
        }
    }
}
