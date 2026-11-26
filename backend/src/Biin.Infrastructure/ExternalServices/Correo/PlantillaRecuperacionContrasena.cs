using System.Net;
using Biin.Application.Interfaces;

namespace Biin.Infrastructure.ExternalServices.Correo;

/// <summary>Asunto y cuerpo (texto y HTML) del correo para restablecer una contraseña olvidada (RF01).</summary>
public static class PlantillaRecuperacionContrasena
{
    public const string Asunto = "Tu código para restablecer tu contraseña en BIIN";

    public static string Texto(string nombre, string codigo, DateTime expiraEnUtc) => $"""
        Hola, {nombre}:

        Recibimos una solicitud para restablecer la contraseña de tu cuenta en BIIN.
        Tu código de recuperación es: {codigo}

        Vale hasta las {HoraLocal(expiraEnUtc)} (hora de Yucatán). Si no solicitaste este cambio,
        ignora este mensaje: tu contraseña actual seguirá funcionando sin cambios.

        BIIN — Viajes y rutas intermunicipales de Yucatán
        """;

    public static string Html(string nombre, string codigo, DateTime expiraEnUtc)
    {
        var n = WebUtility.HtmlEncode(nombre);
        return $"""
            <div style="font-family:Lato,Arial,sans-serif;color:#1f2933;max-width:480px">
              <p>Hola, {n}:</p>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>BIIN</strong>.</p>
              <p style="font-size:28px;letter-spacing:6px;font-weight:bold">{codigo}</p>
              <p>Vale hasta las {HoraLocal(expiraEnUtc)} (hora de Yucatán).</p>
              <p style="color:#52606d;font-size:13px">Si no solicitaste este cambio, ignora este mensaje: tu contraseña actual no se modificará.</p>
            </div>
            """;
    }

    private static string HoraLocal(DateTime expiraEnUtc) => ZonaYucatan.ALocal(expiraEnUtc).ToString("HH:mm");
}
