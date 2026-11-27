using System.ComponentModel.DataAnnotations;

namespace Biin.Application.DTOs.Usuarios;

public record RutaOperadaDto(
    int IdRuta,
    string Codigo,
    string Titulo,
    bool Activa);

public record PerfilUsuarioDto(
    int IdUsuario,
    string Nombre,
    string Correo,
    bool Activo,
    DateTime FechaRegistro,
    IReadOnlyList<string> Roles,
    IReadOnlyList<RutaOperadaDto> RutasOperadas);

/// <summary>Perfil completo más conteos reales de la cuenta en PostgreSQL para la vista de Perfil (CU-01, CU-09, CU-10).</summary>
public record ResumenPerfilDto(
    int IdUsuario,
    string Nombre,
    string Correo,
    bool Activo,
    DateTime FechaRegistro,
    IReadOnlyList<string> Roles,
    IReadOnlyList<RutaOperadaDto> RutasOperadas,
    int ItinerariosGuardados,
    int FavoritosGuardados);

public record ActualizarPerfilRequest(
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(120, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 120 caracteres.")]
    string Nombre,

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    [StringLength(254, ErrorMessage = "El correo es demasiado largo.")]
    string Correo);

public record DesactivarCuentaRequest(
    [Required(ErrorMessage = "La contraseña actual es obligatoria para confirmar la desactivación.")]
    string ContrasenaActual);
