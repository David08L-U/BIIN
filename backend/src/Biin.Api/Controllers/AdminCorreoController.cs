using Biin.Api.Configuration;
using Biin.Application.DTOs.Admin;
using Biin.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Diagnóstico y prueba real de envío SMTP para administradores (RF01, RNF04, RNF08).</summary>
[ApiController]
[Route("api/admin/correo")]
[Authorize(Policy = PoliticasAutorizacion.RequiereAdministrador)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class AdminCorreoController(IDiagnosticoCorreo diagnostico) : ControllerBase
{
    /// <summary>Consulta el estado de configuración SMTP sin exponer contraseñas.</summary>
    [HttpGet("estado")]
    [ProducesResponseType<EstadoCorreoDto>(StatusCodes.Status200OK)]
    public ActionResult<EstadoCorreoDto> Estado() => Ok(diagnostico.ObtenerEstado());

    /// <summary>Envía un correo real de verificación al destinatario indicado usando el SMTP configurado.</summary>
    [HttpPost("prueba")]
    [ProducesResponseType<PruebaCorreoResultadoDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public Task<PruebaCorreoResultadoDto> ProbarEnvio(PruebaCorreoRequest req, CancellationToken ct) =>
        diagnostico.EnviarCorreoPruebaAsync(req.CorreoDestino, ct);
}
