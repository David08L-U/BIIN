namespace Biin.Application.Services;

/// <summary>Sección "VerificacionCorreo" de appsettings: reglas del código que confirma el correo (RF01, RNF04).</summary>
public class VerificacionCorreoOptions
{
    public const string Seccion = "VerificacionCorreo";

    /// <summary>Minutos que vale el código enviado.</summary>
    public int MinutosVigencia { get; set; } = 15;

    /// <summary>Segundos que hay que esperar para pedir otro código al mismo correo.</summary>
    public int SegundosEntreEnvios { get; set; } = 60;

    /// <summary>Códigos incorrectos permitidos antes de anular el registro pendiente.</summary>
    public int IntentosMaximos { get; set; } = 5;

    /// <summary>Si es true, rechaza correos cuyo dominio no tiene servidor de correo (consulta DNS).</summary>
    public bool ValidarDominio { get; set; } = true;

    /// <summary>Cada cuántos minutos se limpian automáticamente los registros pendientes vencidos (0 = desactivado).</summary>
    public int IntervaloLimpiezaMinutos { get; set; } = 60;

    /// <summary>Máximo de registros pendientes vencidos a borrar en cada ciclo de limpieza.</summary>
    public int LoteLimpieza { get; set; } = 200;
}
