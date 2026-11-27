using Biin.Application.DTOs.Admin;
using Biin.Application.Interfaces;
using Biin.Domain.Exceptions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Biin.Infrastructure.ExternalServices.Correo;

/// <summary>
/// Permite validar la configuración SMTP y comprobar el envío real de un correo de prueba (RF01, RNF08).
/// </summary>
public class DiagnosticoCorreoService(
    IOptions<CorreoOptions> opciones,
    IHostEnvironment entorno,
    IReloj reloj,
    ILogger<SmtpEnvioCorreo> loggerSmtp) : IDiagnosticoCorreo
{
    public EstadoCorreoDto ObtenerEstado()
    {
        var o = opciones.Value;
        var observaciones = o.ValidarConfiguracion();

        var modo = o.Configurado
            ? "smtp"
            : entorno.IsDevelopment() ? "desarrollo_log" : "sin_configurar";

        return new EstadoCorreoDto(
            Configurado: o.Configurado,
            Modo: modo,
            Servidor: o.Configurado ? o.Servidor : null,
            Puerto: o.Puerto,
            UsarSsl: o.UsarSsl,
            Remitente: o.Configurado && !string.IsNullOrWhiteSpace(o.RemitenteEfectivo) ? o.RemitenteEfectivo : null,
            TimeoutSegundos: o.TimeoutSegundos,
            ConfiguracionValida: o.Configurado && observaciones.Count == 0,
            Observaciones: observaciones);
    }

    public async Task<PruebaCorreoResultadoDto> EnviarCorreoPruebaAsync(string correoDestino, CancellationToken ct = default)
    {
        var o = opciones.Value;
        var destino = (correoDestino ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(destino))
            throw new ReglaNegocioException("El correo de destino es obligatorio.");

        if (!o.Configurado)
            throw new ServicioNoDisponibleException(
                "No hay un servidor SMTP configurado en Correo:Servidor. Configúralo en appsettings.Development.json o variables de entorno.");

        var observaciones = o.ValidarConfiguracion();
        if (observaciones.Count > 0)
            throw new ReglaNegocioException(string.Join(" ", observaciones));

        var ahoraUtc = reloj.AhoraUtc;
        var horaLocal = ZonaYucatan.ALocal(ahoraUtc).ToString("dd/MM/yyyy HH:mm");
        var texto = $"""
            Verificación de correo SMTP de BIIN.

            Este mensaje confirma que el servidor SMTP configurado ({o.Servidor}:{o.Puerto}) envía correos correctamente.
            Fecha y hora (Yucatán): {horaLocal}
            """;

        var smtp = new SmtpEnvioCorreo(opciones, loggerSmtp);
        try
        {
            await smtp.EnviarMensajeAsync(
                destino,
                nombreDestinatario: null,
                asunto: "BIIN — Verificación de configuración SMTP",
                textoPlano: texto,
                html: null,
                propositoLog: "correo de verificación SMTP",
                ct);
        }
        catch (InvalidOperationException ex)
        {
            throw new ServicioNoDisponibleException(ex.Message);
        }

        return new PruebaCorreoResultadoDto(destino, o.Servidor, o.Puerto, ahoraUtc);
    }
}
