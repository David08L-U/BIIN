using Biin.Api.Configuration;
using Biin.Api.Extensions;
using Biin.Application.DTOs.Auth;
using Biin.Application.DTOs.Usuarios;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Biin.Api.Controllers;

/// <summary>CU-01 Gestionar cuenta y sesión.</summary>
[ApiController]
[Route("api/auth")]
public class AuthController(AuthService auth) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("registro")]
    [EnableRateLimiting(PoliticasRateLimit.Autenticacion)]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthResponse>> Registrar(RegistroRequest req, CancellationToken ct)
    {
        var respuesta = await auth.RegistrarAsync(req, ct);
        return CreatedAtAction(nameof(Yo), respuesta);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [EnableRateLimiting(PoliticasRateLimit.Autenticacion)]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public Task<AuthResponse> IniciarSesion(LoginRequest req, CancellationToken ct) =>
        auth.IniciarSesionAsync(req, ct);

    /// <summary>Datos completos del usuario dueño del token, incluyendo roles y rutas operadas.</summary>
    [Authorize]
    [HttpGet("yo")]
    [ProducesResponseType<PerfilUsuarioDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public Task<PerfilUsuarioDto> Yo(CancellationToken ct) =>
        auth.ObtenerActualAsync(User.IdUsuario(), ct);

    /// <summary>Cierra la sesión revocando el token actual hasta su expiración (CU-01, RF01).</summary>
    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult CerrarSesion()
    {
        auth.CerrarSesion(User.Jti(), User.ExpiraEnUtc());
        return NoContent();
    }

    /// <summary>Cambia la contraseña del usuario autenticado y revoca el token previo (CU-01, RNF04).</summary>
    [Authorize]
    [HttpPut("contrasena")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CambiarContrasena(CambiarContrasenaRequest req, CancellationToken ct)
    {
        await auth.CambiarContrasenaAsync(User.IdUsuario(), req, User.Jti(), User.ExpiraEnUtc(), ct);
        return NoContent();
    }
}
