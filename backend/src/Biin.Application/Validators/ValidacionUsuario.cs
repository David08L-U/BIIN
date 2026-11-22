using Biin.Domain.Exceptions;

namespace Biin.Application.Validators;

/// <summary>Reglas compartidas de normalización y validación para identidad y contraseñas (RF01, RNF04).</summary>
public static class ValidacionUsuario
{
    public const int NombreMin = 2;
    public const int NombreMax = 120;
    public const int CorreoMax = 254;
    public const int ContrasenaMin = 8;
    // BCrypt ignora los bytes posteriores al byte 72
    public const int ContrasenaMax = 72;

    public static string NormalizarNombre(string nombre)
    {
        var limpio = (nombre ?? string.Empty).Trim();
        if (limpio.Length is < NombreMin or > NombreMax)
            throw new ReglaNegocioException($"El nombre debe tener entre {NombreMin} y {NombreMax} caracteres.");
        return limpio;
    }

    public static string NormalizarCorreo(string correo)
    {
        var limpio = (correo ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(limpio) || limpio.Length > CorreoMax || !limpio.Contains('@'))
            throw new ReglaNegocioException("El correo no tiene un formato válido.");
        return limpio;
    }

    public static void ValidarContrasena(string contrasena)
    {
        if (string.IsNullOrWhiteSpace(contrasena) || contrasena.Length is < ContrasenaMin or > ContrasenaMax)
            throw new ReglaNegocioException(
                $"La contraseña debe tener entre {ContrasenaMin} y {ContrasenaMax} caracteres y no puede ser solo espacios.");
    }
}
