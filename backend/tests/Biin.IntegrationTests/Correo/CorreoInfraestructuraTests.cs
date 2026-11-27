using System.Net;
using System.Net.Sockets;
using System.Text;
using Biin.Application.Interfaces;
using Biin.Infrastructure.ExternalServices.Correo;
using DnsClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Biin.IntegrationTests.Correo;

/// <summary>Plantilla del código, validación SMTP y envío SMTP real sobre loopback (RF01, RNF08).</summary>
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

    [Fact]
    public void La_plantilla_de_recuperacion_muestra_codigo_hora_local_y_escapa_HTML()
    {
        var texto = PlantillaRecuperacionContrasena.Texto("María", "819203", Expira);
        var html = PlantillaRecuperacionContrasena.Html("<b>Maria</b>", "819203", Expira);

        Assert.Contains("819203", texto);
        Assert.Contains("12:15", texto);
        Assert.Contains("819203", html);
        Assert.Contains("12:15", html);
        Assert.DoesNotContain("<b>Maria</b>", html);
        Assert.Contains("&lt;b&gt;Maria&lt;/b&gt;", html);
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

    [Fact]
    public void ValidarConfiguracion_detecta_puerto_remitente_y_contrasena_faltantes()
    {
        var invalida = new CorreoOptions
        {
            Servidor = "smtp.ejemplo.mx",
            Puerto = 0,
            Usuario = "notificaciones@ejemplo.mx",
            Contrasena = "",
            TimeoutSegundos = 0
        };

        var observaciones = invalida.ValidarConfiguracion();
        Assert.Contains(observaciones, o => o.Contains("Puerto", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(observaciones, o => o.Contains("TimeoutSegundos", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(observaciones, o => o.Contains("Contrasena", StringComparison.OrdinalIgnoreCase));

        var valida = new CorreoOptions
        {
            Servidor = "smtp.ejemplo.mx",
            Puerto = 587,
            Usuario = "notificaciones@ejemplo.mx",
            Contrasena = "app-password-secreta",
            TimeoutSegundos = 15
        };
        Assert.Empty(valida.ValidarConfiguracion());
    }

    [Fact]
    public async Task SmtpEnvioCorreo_y_DiagnosticoCorreoService_envian_mensajes_reales_por_protocolo_SMTP_en_loopback()
    {
        using var servidor = new ServidorSmtpLoopback();
        var opciones = Options.Create(new CorreoOptions
        {
            Servidor = "127.0.0.1",
            Puerto = servidor.Puerto,
            UsarSsl = false,
            Remitente = "noreply@biin.test",
            NombreRemitente = "BIIN Yucatán",
            TimeoutSegundos = 5
        });

        var smtp = new SmtpEnvioCorreo(opciones, NullLogger<SmtpEnvioCorreo>.Instance);
        var tareaRecepcion = servidor.AceptarUnMensajeAsync();
        await smtp.EnviarCodigoVerificacionAsync("viajero@biin.test", "Ana", "654321", Expira);
        var recibido = await tareaRecepcion;

        Assert.Contains("MAIL FROM:<noreply@biin.test>", recibido, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("RCPT TO:<viajero@biin.test>", recibido, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("654321", ExtraerTextoDecodificado(recibido));

        var diagnostico = new DiagnosticoCorreoService(
            opciones,
            new EntornoFalso("Production"),
            new RelojFijo(Expira),
            NullLogger<SmtpEnvioCorreo>.Instance);

        var estado = diagnostico.ObtenerEstado();
        Assert.True(estado.Configurado);
        Assert.True(estado.ConfiguracionValida);
        Assert.Equal("smtp", estado.Modo);

        var tareaPrueba = servidor.AceptarUnMensajeAsync();
        var resultado = await diagnostico.EnviarCorreoPruebaAsync("admin@biin.test");
        var recibidoPrueba = await tareaPrueba;

        Assert.Equal("admin@biin.test", resultado.CorreoDestino);
        Assert.Equal("127.0.0.1", resultado.Servidor);
        Assert.Equal(servidor.Puerto, resultado.Puerto);
        Assert.Contains("RCPT TO:<admin@biin.test>", recibidoPrueba, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("SMTP", ExtraerTextoDecodificado(recibidoPrueba));
    }

    private static string ExtraerTextoDecodificado(string transcripcion)
    {
        var salida = new StringBuilder(transcripcion);
        var acumulador = new StringBuilder();
        foreach (var linea in transcripcion.Split(["\r\n", "\n"], StringSplitOptions.None))
        {
            var t = linea.Trim();
            if (t.Length > 0 && !t.StartsWith("--") && !t.Contains(':') && t.All(c => char.IsLetterOrDigit(c) || c is '+' or '/' or '='))
            {
                acumulador.Append(t);
                continue;
            }

            if (acumulador.Length >= 8 && acumulador.Length % 4 == 0)
            {
                try
                {
                    salida.AppendLine(Encoding.UTF8.GetString(Convert.FromBase64String(acumulador.ToString())));
                }
                catch (FormatException) { }
            }
            acumulador.Clear();
        }
        return salida.ToString();
    }

    private sealed class RelojFijo(DateTime ahoraUtc) : IReloj
    {
        public DateTime AhoraUtc { get; } = ahoraUtc;
    }

    private sealed class EntornoFalso(string nombre) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = nombre;
        public string ApplicationName { get; set; } = "Biin.Tests";
        public string ContentRootPath { get; set; } = ".";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    /// <summary>Servidor SMTP TCP mínimo en 127.0.0.1 para verificar envíos reales sin depender de red externa.</summary>
    private sealed class ServidorSmtpLoopback : IDisposable
    {
        private readonly TcpListener _listener;

        public ServidorSmtpLoopback()
        {
            _listener = new TcpListener(IPAddress.Loopback, 0);
            _listener.Start();
            Puerto = ((IPEndPoint)_listener.LocalEndpoint).Port;
        }

        public int Puerto { get; }

        public async Task<string> AceptarUnMensajeAsync()
        {
            using var cliente = await _listener.AcceptTcpClientAsync();
            await using var stream = cliente.GetStream();
            using var reader = new StreamReader(stream, Encoding.ASCII, leaveOpen: true);
            await using var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true) { AutoFlush = true, NewLine = "\r\n" };

            var transcripcion = new StringBuilder();
            await writer.WriteLineAsync("220 biin-loopback ESMTP");

            while (await reader.ReadLineAsync() is { } linea)
            {
                transcripcion.AppendLine(linea);
                if (linea.StartsWith("EHLO", StringComparison.OrdinalIgnoreCase) ||
                    linea.StartsWith("HELO", StringComparison.OrdinalIgnoreCase))
                {
                    await writer.WriteLineAsync("250-biin-loopback");
                    await writer.WriteLineAsync("250 SIZE 10485760");
                }
                else if (linea.StartsWith("MAIL FROM", StringComparison.OrdinalIgnoreCase) ||
                         linea.StartsWith("RCPT TO", StringComparison.OrdinalIgnoreCase))
                {
                    await writer.WriteLineAsync("250 OK");
                }
                else if (linea.Equals("DATA", StringComparison.OrdinalIgnoreCase))
                {
                    await writer.WriteLineAsync("354 Start mail input");
                    while (await reader.ReadLineAsync() is { } cuerpo && cuerpo != ".")
                        transcripcion.AppendLine(cuerpo);
                    await writer.WriteLineAsync("250 Message accepted");
                }
                else if (linea.StartsWith("QUIT", StringComparison.OrdinalIgnoreCase))
                {
                    await writer.WriteLineAsync("221 Bye");
                    break;
                }
                else
                {
                    await writer.WriteLineAsync("250 OK");
                }
            }

            return transcripcion.ToString();
        }

        public void Dispose() => _listener.Stop();
    }
}
