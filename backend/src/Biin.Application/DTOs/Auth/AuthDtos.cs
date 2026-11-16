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
    [StringLength(100, MinimumLength = 8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
    string Contrasena);

public record LoginRequest(
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    string Correo,

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    string Contrasena);

public record UsuarioDto(int IdUsuario, string Nombre, string Correo, IReadOnlyList<string> Roles);

public record AuthResponse(string Token, DateTime ExpiraEn, UsuarioDto Usuario);
