using System.Net;
using System.Net.Mail;
using System.Text;
using Biin.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Biin.Infrastructure.ExternalServices.Correo;

/// <summary>Manda los códigos de confirmación por SMTP (RF01).</summary>
public class SmtpEnvioCorreo(IOptions<CorreoOptions> opciones, ILogger<SmtpEnvioCorreo> logger) : IEnvioCorreo
{
    private readonly CorreoOptions _o = opciones.Value;

    public async Task EnviarCodigoVerificacionAsync(
        string correo, string nombre, string codigo, DateTime expiraEnUtc, CancellationToken ct = default)
    {
        var remitente = string.IsNullOrWhiteSpace(_o.Remitente) ? _o.Usuario : _o.Remitente;

        using var mensaje = new MailMessage
        {
            From = new MailAddress(remitente, _o.NombreRemitente, Encoding.UTF8),
            Subject = PlantillaCodigoVerificacion.Asunto,
            SubjectEncoding = Encoding.UTF8,
            Body = PlantillaCodigoVerificacion.Texto(nombre, codigo, expiraEnUtc),
            BodyEncoding = Encoding.UTF8,
            IsBodyHtml = false
        };
        mensaje.To.Add(new MailAddress(correo, nombre, Encoding.UTF8));
        mensaje.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(
            PlantillaCodigoVerificacion.Html(nombre, codigo, expiraEnUtc), Encoding.UTF8, "text/html"));

        using var cliente = new SmtpClient(_o.Servidor, _o.Puerto)
        {
            EnableSsl = _o.UsarSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Credentials = string.IsNullOrWhiteSpace(_o.Usuario) ? null : new NetworkCredential(_o.Usuario, _o.Contrasena)
        };

        try
        {
            await cliente.SendMailAsync(mensaje, ct);
        }
        catch (SmtpException ex)
        {
            // El código no se muestra en el log: solo el destinatario debe conocerlo
            logger.LogError(ex, "No se pudo enviar el código de confirmación a {Correo}", correo);
            throw new InvalidOperationException("No se pudo enviar el correo de confirmación.", ex);
        }
    }
}
