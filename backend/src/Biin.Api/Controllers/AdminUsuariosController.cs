using Biin.Api.Configuration;
using Biin.Api.Extensions;
using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Usuarios;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Administración de usuarios, roles y rutas operadas (CU-12, RF12, RNF04).</summary>
[ApiController]
[Route("api/admin")]
[Authorize(Policy = PoliticasAutorizacion.RequiereAdministrador)]
public class AdminUsuariosController(AdminUsuariosService adminUsuarios) : ControllerBase
{
    /// <summary>Lista el catálogo de roles disponibles.</summary>
    [HttpGet("roles")]
    [ProducesResponseType<IReadOnlyList<RolDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IReadOnlyList<RolDto>> ListarRoles(CancellationToken ct) =>
        adminUsuarios.ListarRolesAsync(ct);

    /// <summary>Lista usuarios con filtros opcionales por texto, rol y estado activo.</summary>
    [HttpGet("usuarios")]
    [ProducesResponseType<PaginaResultado<UsuarioResumenDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<PaginaResultado<UsuarioResumenDto>> ListarUsuarios(
        [FromQuery] FiltroUsuariosRequest filtro,
        CancellationToken ct) =>
        adminUsuarios.ListarUsuariosAsync(filtro, ct);

    /// <summary>Consulta el detalle completo de un usuario, sus roles y sus rutas operadas.</summary>
    [HttpGet("usuarios/{id:int}")]
    [ProducesResponseType<PerfilUsuarioDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<PerfilUsuarioDto> ObtenerPorId(int id, CancellationToken ct) =>
        adminUsuarios.ObtenerPorIdAsync(id, ct);

    /// <summary>Crea un usuario con roles específicos y opcionalmente rutas operadas.</summary>
    [HttpPost("usuarios")]
    [ProducesResponseType<PerfilUsuarioDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PerfilUsuarioDto>> Crear(CrearUsuarioAdminRequest req, CancellationToken ct)
    {
        var creado = await adminUsuarios.CrearUsuarioAsync(User.IdUsuario(), req, ct);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.IdUsuario }, creado);
    }

    /// <summary>Reemplaza los roles asignados a un usuario conservando siempre el rol viajero.</summary>
    [HttpPut("usuarios/{id:int}/roles")]
    [ProducesResponseType<PerfilUsuarioDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<PerfilUsuarioDto> ActualizarRoles(int id, ActualizarRolesRequest req, CancellationToken ct) =>
        adminUsuarios.ActualizarRolesAsync(User.IdUsuario(), id, req, ct);

    /// <summary>Activa o desactiva (retiro lógico) la cuenta de un usuario.</summary>
    [HttpPatch("usuarios/{id:int}/estado")]
    [ProducesResponseType<PerfilUsuarioDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<PerfilUsuarioDto> CambiarEstado(int id, CambiarEstadoUsuarioRequest req, CancellationToken ct) =>
        adminUsuarios.CambiarEstadoAsync(User.IdUsuario(), id, req, ct);

    /// <summary>Asigna o actualiza las rutas autorizadas en operador_ruta para un operador.</summary>
    [HttpPut("usuarios/{id:int}/rutas")]
    [ProducesResponseType<PerfilUsuarioDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<PerfilUsuarioDto> ActualizarRutas(int id, ActualizarRutasOperadorRequest req, CancellationToken ct) =>
        adminUsuarios.ActualizarRutasOperadorAsync(User.IdUsuario(), id, req, ct);
}
