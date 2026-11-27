using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Biin.IntegrationTests.Transporte;

/// <summary>Pruebas HTTP de acceso público y validación de consulta de tarifas (RF03, RF01).</summary>
public class TarifasEndpointsTests(TarifasEndpointsTests.TarifasFactory factory)
    : IClassFixture<TarifasEndpointsTests.TarifasFactory>
{
    [Theory]
    [InlineData("/api/rutas/1/tarifas?ordenOrigen=3&ordenDestino=1")]
    [InlineData("/api/rutas/1/tarifas?ordenOrigen=2&ordenDestino=2")]
    [InlineData("/api/rutas/1/tarifas?ordenOrigen=0")]
    public async Task Consulta_publica_de_tarifas_con_tramo_invalido_devuelve_400_sin_requerir_sesion(string ruta)
    {
        using var client = factory.CreateClient();

        var resp = await client.GetAsync(ruta);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    public class TarifasFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Biin", "Host=localhost;Database=biin_test;Username=biin_app;Password=test");
            builder.UseSetting("Jwt:Clave", "clave-tarifas-biin-con-al-menos-32-caracteres-seguros");
            builder.UseSetting("Jwt:Emisor", "biin-api");
            builder.UseSetting("Jwt:Audiencia", "biin-web");
        }
    }
}
