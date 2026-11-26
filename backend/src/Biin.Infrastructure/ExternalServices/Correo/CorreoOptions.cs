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

    public bool Configurado => !string.IsNullOrWhiteSpace(Servidor);
}
