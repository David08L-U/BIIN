using System.ComponentModel.DataAnnotations;

namespace Biin.Application.DTOs.Auth;

public record RegistroRequest(
    [Required, StringLength(120, MinimumLength = 2)] string Nombre,
    [Required, EmailAddress, StringLength(254)] string Correo,
    [Required, StringLength(100, MinimumLength = 8)] string Contrasena);

public record LoginRequest(
    [Required, EmailAddress] string Correo,
    [Required] string Contrasena);

public record UsuarioDto(int IdUsuario, string Nombre, string Correo, IReadOnlyList<string> Roles);

public record AuthResponse(string Token, DateTime ExpiraEn, UsuarioDto Usuario);
