using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Biin.IntegrationTests.Auth;

/// <summary>Comprueba los headers anti-caché en rutas de auth, perfil y endpoints privados (RNF04).</summary>
public class HeadersAntiCacheTests(HeadersAntiCacheTests.ApiCacheFactory factory)
    : IClassFixture<HeadersAntiCacheTests.ApiCacheFactory>
{
    [Theory]
    [InlineData("/api/auth/yo")]
    [InlineData("/api/usuarios/perfil")]
    [InlineData("/api/admin/roles")]
    [InlineData("/api/itinerarios")]
    public async Task Endpoints_sensibles_devuelven_headers_no_store(string ruta)
    {
        using var client = factory.CreateClient();

        var resp = await client.GetAsync(ruta);

        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
        AssertNoStore(resp);
    }

    [Fact]
    public async Task Login_con_error_de_validacion_tambien_incluye_headers_no_store()
    {
        using var client = factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/auth/login", new { correo = "invalido", contrasena = "" });

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        AssertNoStore(resp);
    }

    [Fact]
    public async Task Ruta_publica_con_header_Authorization_incluye_no_store_y_sin_el_no_lo_forza()
    {
        using var clientPublico = factory.CreateClient();
        var respPublica = await clientPublico.GetAsync("/api/no-existe-ruta-publica");
        Assert.False(respPublica.Headers.CacheControl?.NoStore ?? false);

        using var clientConToken = factory.CreateClient();
        clientConToken.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "token.cualquiera");
        var respConToken = await clientConToken.GetAsync("/api/no-existe-ruta-publica");
        AssertNoStore(respConToken);
    }

    private static void AssertNoStore(HttpResponseMessage resp)
    {
        Assert.NotNull(resp.Headers.CacheControl);
        Assert.True(resp.Headers.CacheControl!.NoStore);
        Assert.True(resp.Headers.CacheControl!.NoCache);
        Assert.Contains("no-cache", resp.Headers.Pragma.Select(p => p.Name), StringComparer.OrdinalIgnoreCase);
        Assert.True(resp.Content.Headers.TryGetValues("Expires", out var expires) && expires.Contains("0"));
    }

    public class ApiCacheFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Biin", "Host=localhost;Database=biin_test;Username=biin_app;Password=test");
            builder.UseSetting("Jwt:Clave", "clave-cache-biin-con-al-menos-32-caracteres-seguros");
            builder.UseSetting("Jwt:Emisor", "biin-api");
            builder.UseSetting("Jwt:Audiencia", "biin-web");
        }
    }
}
