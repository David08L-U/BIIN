namespace Biin.Infrastructure.Security;

/// <summary>Sección "Jwt" de appsettings.</summary>
public class JwtOptions
{
    public const string Seccion = "Jwt";

    public string Emisor { get; set; } = "biin-api";
    public string Audiencia { get; set; } = "biin-web";
    /// <summary>Mínimo 32 caracteres. Va en appsettings.Development.json, nunca en el repo.</summary>
    public string Clave { get; set; } = string.Empty;
    public int MinutosExpiracion { get; set; } = 120;
}
