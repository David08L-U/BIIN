using System.ComponentModel.DataAnnotations;

namespace Biin.Application.DTOs.Admin;

public record RolDto(int IdRol, string Nombre);

public record UsuarioResumenDto(
    int IdUsuario,
    string Nombre,
    string Correo,
    bool Activo,
    DateTime FechaRegistro,
    IReadOnlyList<string> Roles,
    int TotalRutasOperadas);

public record PaginaResultado<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Pagina,
    int Tamano);

public record FiltroUsuariosRequest(
    string? Busqueda = null,
    string? Rol = null,
    bool? Activo = null,
    int Pagina = 1,
    int Tamano = 20);

public record CrearUsuarioAdminRequest(
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(120, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 120 caracteres.")]
    string Nombre,

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    [StringLength(254, ErrorMessage = "El correo es demasiado largo.")]
    string Correo,

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [StringLength(72, MinimumLength = 8, ErrorMessage = "La contraseña debe tener entre 8 y 72 caracteres.")]
    string Contrasena,

    [Required(ErrorMessage = "Debe indicar los roles del usuario.")]
    IReadOnlyList<string> Roles,

    IReadOnlyList<int>? IdRutas = null);

public record ActualizarRolesRequest(
    [Required(ErrorMessage = "Debe indicar los roles del usuario.")]
    IReadOnlyList<string> Roles);

public record CambiarEstadoUsuarioRequest(bool Activo);

public record ActualizarRutasOperadorRequest(
    [Required(ErrorMessage = "Debe indicar la lista de rutas.")]
    IReadOnlyList<int> IdRutas);
