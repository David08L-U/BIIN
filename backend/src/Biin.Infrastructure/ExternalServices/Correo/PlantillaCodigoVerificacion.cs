using System.Net;
using Biin.Application.Interfaces;

namespace Biin.Infrastructure.ExternalServices.Correo;

/// <summary>Asunto y cuerpo (texto y HTML) del correo con el código de confirmación.</summary>
public static class PlantillaCodigoVerificacion
{
    public const string Asunto = "Tu código para crear tu cuenta en BIIN";

    public static string Texto(string nombre, string codigo, DateTime expiraEnUtc) => $"""
        Hola, {nombre}:

        Tu código para confirmar tu correo en BIIN es: {codigo}

        Vale hasta las {HoraLocal(expiraEnUtc)} (hora de Yucatán). Si no fuiste tú, ignora este mensaje:
        sin el código no se crea ninguna cuenta.

        BIIN — Viajes y rutas intermunicipales de Yucatán
        """;

    public static string Html(string nombre, string codigo, DateTime expiraEnUtc)
    {
        var n = WebUtility.HtmlEncode(nombre);
        return $"""
            <div style="font-family:Lato,Arial,sans-serif;color:#1f2933;max-width:480px">
              <p>Hola, {n}:</p>
              <p>Tu código para confirmar tu correo en <strong>BIIN</strong> es:</p>
              <p style="font-size:28px;letter-spacing:6px;font-weight:bold">{codigo}</p>
              <p>Vale hasta las {HoraLocal(expiraEnUtc)} (hora de Yucatán).</p>
              <p style="color:#52606d;font-size:13px">Si no fuiste tú, ignora este mensaje: sin el código no se crea ninguna cuenta.</p>
            </div>
            """;
    }

    private static string HoraLocal(DateTime expiraEnUtc) => ZonaYucatan.ALocal(expiraEnUtc).ToString("HH:mm");
}
