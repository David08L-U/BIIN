using System.ComponentModel.DataAnnotations;

namespace Biin.Application.DTOs.Auth;

public record RegistroRequest(
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(120, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 120 caracteres.")]
    string Nombre,

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    [StringLength(254, ErrorMessage = "El correo es demasiado largo.")]
    string Correo,

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [StringLength(72, MinimumLength = 8, ErrorMessage = "La contraseña debe tener entre 8 y 72 caracteres.")]
    string Contrasena);

public record LoginRequest(
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    string Correo,

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    string Contrasena);

public record CambiarContrasenaRequest(
    [Required(ErrorMessage = "La contraseña actual es obligatoria.")]
    string ContrasenaActual,

    [Required(ErrorMessage = "La nueva contraseña es obligatoria.")]
    [StringLength(72, MinimumLength = 8, ErrorMessage = "La nueva contraseña debe tener entre 8 y 72 caracteres.")]
    string ContrasenaNueva);

public record VerificarRegistroRequest(
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    string Correo,

    [Required(ErrorMessage = "El código es obligatorio.")]
    [RegularExpression(@"^\s*\d{6}\s*$", ErrorMessage = "El código tiene 6 dígitos.")]
    string Codigo);

/// <summary>
/// Respuesta del registro de un viajero: la cuenta aún no existe. Llegó un código a <paramref name="Correo"/>
/// que vale hasta <paramref name="ExpiraEn"/>; se puede pedir otro a partir de <paramref name="ReenviarDesde"/>.
/// </summary>
public record RegistroPendienteResponse(string Correo, DateTime ExpiraEn, DateTime ReenviarDesde);

public record UsuarioDto(int IdUsuario, string Nombre, string Correo, IReadOnlyList<string> Roles);

public record AuthResponse(string Token, DateTime ExpiraEn, UsuarioDto Usuario);
