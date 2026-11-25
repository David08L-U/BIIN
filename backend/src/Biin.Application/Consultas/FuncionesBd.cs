using System.Globalization;
using System.Text;

namespace Biin.Application.Consultas;

/// <summary>
/// Funciones de PostgreSQL que se pueden usar dentro de consultas LINQ.
/// Infrastructure las registra con <c>HasDbFunction</c>; fuera de EF Core (pruebas en memoria)
/// se ejecuta el cuerpo en C#, que aplica la misma regla.
/// </summary>
public static class FuncionesBd
{
    /// <summary>
    /// Se traduce a <c>f_normalizar(texto)</c> (database/schema/003_busqueda.sql):
    /// quita acentos y pasa a minúsculas para que "homun" encuentre "Homún".
    /// </summary>
    public static string Normalizar(string texto) => NormalizarTexto(texto);

    /// <summary>Misma normalización en C#, para preparar el texto que escribe el usuario.</summary>
    public static string NormalizarTexto(string? texto)
    {
        if (string.IsNullOrEmpty(texto))
            return string.Empty;

        var descompuesto = texto.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(descompuesto.Length);
        foreach (var c in descompuesto)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
    }
}
