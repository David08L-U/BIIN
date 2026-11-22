using Biin.Api.Extensions;
using Biin.Application.DTOs.Usuarios;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Gestión del perfil propio del usuario autenticado (CU-01, RF01).</summary>
[ApiController]
[Route("api/usuarios")]
[Authorize]
public class UsuariosController(UsuariosService usuarios) : ControllerBase
{
    /// <summary>Devuelve el perfil completo del usuario autenticado, incluyendo roles y rutas operadas.</summary>
    [HttpGet("perfil")]
    [ProducesResponseType<PerfilUsuarioDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public Task<PerfilUsuarioDto> ObtenerPerfil(CancellationToken ct) =>
        usuarios.ObtenerPerfilAsync(User.IdUsuario(), ct);

    /// <summary>Actualiza el nombre y correo del usuario autenticado.</summary>
    [HttpPut("perfil")]
    [ProducesResponseType<PerfilUsuarioDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<PerfilUsuarioDto> ActualizarPerfil(ActualizarPerfilRequest req, CancellationToken ct) =>
        usuarios.ActualizarPerfilAsync(User.IdUsuario(), req, ct);

    /// <summary>Desactiva lógicamente la cuenta del usuario autenticado confirmando su contraseña.</summary>
    [HttpDelete("perfil")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DesactivarCuenta([FromBody] DesactivarCuentaRequest req, CancellationToken ct)
    {
        await usuarios.DesactivarCuentaPropiaAsync(
            User.IdUsuario(),
            req,
            User.Jti(),
            User.ExpiraEnUtc(),
            ct);
        return NoContent();
    }
}
