using Biin.Infrastructure.ExternalServices.Correo;
using DnsClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;

namespace Biin.IntegrationTests.Correo;

/// <summary>Plantilla del código y validaciones del dominio que no necesitan red (RF01).</summary>
public class CorreoInfraestructuraTests
{
    private static readonly DateTime Expira = new(2026, 12, 7, 18, 15, 0, DateTimeKind.Utc);

    [Fact]
    public void La_plantilla_muestra_el_codigo_y_la_hora_de_Yucatan()
    {
        var texto = PlantillaCodigoVerificacion.Texto("María", "042917", Expira);
        var html = PlantillaCodigoVerificacion.Html("María", "042917", Expira);

        Assert.Contains("042917", texto);
        Assert.Contains("042917", html);
        // 18:15 UTC = 12:15 en Yucatán (UTC−6)
        Assert.Contains("12:15", texto);
        Assert.Contains("12:15", html);
    }

    [Fact]
    public void La_plantilla_HTML_escapa_el_nombre()
    {
        var html = PlantillaCodigoVerificacion.Html("<script>x</script>", "123456", Expira);

        Assert.DoesNotContain("<script>", html);
        Assert.Contains("&lt;script&gt;", html);
    }

    [Theory]
    [InlineData("localhost")]
    [InlineData("sin-punto")]
    [InlineData("")]
    public async Task El_validador_rechaza_dominios_sin_punto_sin_consultar_el_DNS(string dominio)
    {
        var validador = new DnsValidadorDominioCorreo(
            new LookupClient(new LookupClientOptions { Timeout = TimeSpan.FromMilliseconds(1), Retries = 0 }),
            new MemoryCache(new MemoryCacheOptions()),
            NullLogger<DnsValidadorDominioCorreo>.Instance);

        Assert.False(await validador.PuedeRecibirCorreoAsync(dominio));
    }

    [Fact]
    public void Sin_servidor_SMTP_las_opciones_indican_que_no_esta_configurado()
    {
        Assert.False(new CorreoOptions().Configurado);
        Assert.True(new CorreoOptions { Servidor = "smtp.ejemplo.mx" }.Configurado);
    }
}
