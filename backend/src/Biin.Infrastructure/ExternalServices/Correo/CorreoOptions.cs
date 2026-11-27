using System.Net.Mail;

namespace Biin.Infrastructure.ExternalServices.Correo;

/// <summary>
/// Sección "Correo" de appsettings: servidor SMTP con el que se mandan los códigos.
/// Usuario y contraseña van en appsettings.Development.json o en variables de entorno, nunca en el repo.
/// </summary>
public class CorreoOptions
{
    public const string Seccion = "Correo";

    /// <summary>Por ejemplo smtp.gmail.com. Vacío = no hay SMTP (en desarrollo el código se escribe en el log).</summary>
    public string Servidor { get; set; } = string.Empty;
    public int Puerto { get; set; } = 587;
    public string Usuario { get; set; } = string.Empty;
    public string Contrasena { get; set; } = string.Empty;
    /// <summary>STARTTLS en el puerto 587 o SSL directo en el 465.</summary>
    public bool UsarSsl { get; set; } = true;
    /// <summary>Dirección que aparece como remitente; si va vacía se usa <see cref="Usuario"/>.</summary>
    public string Remitente { get; set; } = string.Empty;
    public string NombreRemitente { get; set; } = "BIIN Yucatán";
    /// <summary>Tiempo máximo de espera al servidor SMTP en segundos.</summary>
    public int TimeoutSegundos { get; set; } = 15;

    public bool Configurado => !string.IsNullOrWhiteSpace(Servidor);

    public string RemitenteEfectivo => string.IsNullOrWhiteSpace(Remitente) ? Usuario : Remitente;

    public IReadOnlyList<string> ValidarConfiguracion()
    {
        var observaciones = new List<string>();
        if (!Configurado)
            return observaciones;

        if (Puerto is < 1 or > 65535)
            observaciones.Add("Correo:Puerto debe estar entre 1 y 65535.");

        if (TimeoutSegundos is < 1 or > 120)
            observaciones.Add("Correo:TimeoutSegundos debe estar entre 1 y 120 segundos.");

        if (string.IsNullOrWhiteSpace(RemitenteEfectivo) || !MailAddress.TryCreate(RemitenteEfectivo, out _))
            observaciones.Add("Debes configurar un remitente válido en Correo:Remitente o Correo:Usuario.");

        if (!string.IsNullOrWhiteSpace(Usuario) && string.IsNullOrWhiteSpace(Contrasena))
            observaciones.Add("Correo:Usuario está configurado pero falta Correo:Contrasena.");

        return observaciones;
    }
}
