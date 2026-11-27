using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Biin.IntegrationTests.Transporte;

/// <summary>Pruebas HTTP de acceso público y validaciones de entrada para rutas de combis (RF02, RF03, RNF05).</summary>
public class RutasEndpointsTests(RutasEndpointsTests.RutasFactory factory)
    : IClassFixture<RutasEndpointsTests.RutasFactory>
{
    [Theory]
    [InlineData("/api/rutas?diaSemana=-1")]
    [InlineData("/api/rutas?diaSemana=7")]
    [InlineData("/api/rutas/0")]
    [InlineData("/api/rutas/1?diaSemana=8")]
    [InlineData("/api/rutas/0/salidas")]
    [InlineData("/api/rutas/cercanas?lat=95&lng=-89.6")]
    [InlineData("/api/rutas/cercanas?lat=20.9&lng=-89.6&radioKm=0.1")]
    public async Task Parametros_invalidos_en_endpoints_publicos_de_rutas_devuelven_400_sin_token(string url)
    {
        using var client = factory.CreateClient();

        var resp = await client.GetAsync(url);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    public class RutasFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Biin", "Host=localhost;Database=biin_test;Username=biin_app;Password=test");
            builder.UseSetting("Jwt:Clave", "clave-rutas-biin-con-al-menos-32-caracteres-seguros");
            builder.UseSetting("Jwt:Emisor", "biin-api");
            builder.UseSetting("Jwt:Audiencia", "biin-web");
        }
    }
}
