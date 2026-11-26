using System.Net;
using System.Net.Mail;
using System.Text;
using Biin.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Biin.Infrastructure.ExternalServices.Correo;

/// <summary>Manda los correos transaccionales de la plataforma por SMTP (RF01).</summary>
public class SmtpEnvioCorreo(IOptions<CorreoOptions> opciones, ILogger<SmtpEnvioCorreo> logger) : IEnvioCorreo
{
    private readonly CorreoOptions _o = opciones.Value;

    public Task EnviarCodigoVerificacionAsync(
        string correo, string nombre, string codigo, DateTime expiraEnUtc, CancellationToken ct = default) =>
        EnviarMensajeAsync(
            correo,
            nombre,
            PlantillaCodigoVerificacion.Asunto,
            PlantillaCodigoVerificacion.Texto(nombre, codigo, expiraEnUtc),
            PlantillaCodigoVerificacion.Html(nombre, codigo, expiraEnUtc),
            "código de confirmación",
            ct);

    internal async Task EnviarMensajeAsync(
        string correo,
        string? nombreDestinatario,
        string asunto,
        string textoPlano,
        string? html,
        string propositoLog,
        CancellationToken ct)
    {
        var observaciones = _o.ValidarConfiguracion();
        if (observaciones.Count > 0)
            throw new InvalidOperationException($"Configuración SMTP inválida: {string.Join(" ", observaciones)}");

        var remitente = _o.RemitenteEfectivo;

        using var mensaje = new MailMessage
        {
            From = new MailAddress(remitente, _o.NombreRemitente, Encoding.UTF8),
            Subject = asunto,
            SubjectEncoding = Encoding.UTF8,
            Body = textoPlano,
            BodyEncoding = Encoding.UTF8,
            IsBodyHtml = false
        };
        mensaje.To.Add(string.IsNullOrWhiteSpace(nombreDestinatario)
            ? new MailAddress(correo)
            : new MailAddress(correo, nombreDestinatario, Encoding.UTF8));

        if (!string.IsNullOrWhiteSpace(html))
            mensaje.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(html, Encoding.UTF8, "text/html"));

        using var cliente = new SmtpClient(_o.Servidor, _o.Puerto)
        {
            EnableSsl = _o.UsarSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = Math.Clamp(_o.TimeoutSegundos, 3, 120) * 1000,
            Credentials = string.IsNullOrWhiteSpace(_o.Usuario) ? null : new NetworkCredential(_o.Usuario, _o.Contrasena)
        };

        try
        {
            await cliente.SendMailAsync(mensaje, ct);
        }
        catch (SmtpException ex)
        {
            // Nunca se escriben códigos ni contraseñas en el log
            logger.LogError(ex, "No se pudo enviar el {Proposito} a {Correo} vía {Servidor}:{Puerto}",
                propositoLog, correo, _o.Servidor, _o.Puerto);
            throw new InvalidOperationException($"No se pudo enviar el {propositoLog} por SMTP.", ex);
        }
    }
}
