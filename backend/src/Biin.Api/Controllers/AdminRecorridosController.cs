using Biin.Api.Configuration;
using Biin.Api.Extensions;
using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Comun;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Administración de recorridos sugeridos y sus etapas con bitácora (RF12, CU-12, CU-13, 17.1.5).</summary>
[ApiController]
[Route("api/admin/recorridos")]
[Authorize(Policy = PoliticasAutorizacion.RequiereAdministrador)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class AdminRecorridosController(AdminRecorridosService recorridos) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PaginaResultado<RecorridoAdminResumenDto>>(StatusCodes.Status200OK)]
    public Task<PaginaResultado<RecorridoAdminResumenDto>> Listar(
        [FromQuery] FiltroAdminRecorridosRequest filtro,
        CancellationToken ct) =>
        recorridos.ListarAsync(filtro, ct);

    [HttpGet("{idRecorrido:int}")]
    [ProducesResponseType<RecorridoAdminDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<RecorridoAdminDetalleDto> ObtenerPorId(int idRecorrido, CancellationToken ct) =>
        recorridos.ObtenerPorIdAsync(idRecorrido, ct);

    [HttpPost]
    [ProducesResponseType<RecorridoAdminDetalleDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RecorridoAdminDetalleDto>> Crear(CrearRecorridoRequest req, CancellationToken ct)
    {
        var creado = await recorridos.CrearAsync(User.IdUsuario(), req, ct);
        return CreatedAtAction(nameof(ObtenerPorId), new { idRecorrido = creado.IdRecorrido }, creado);
    }

    [HttpPut("{idRecorrido:int}")]
    [ProducesResponseType<RecorridoAdminDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<RecorridoAdminDetalleDto> Actualizar(int idRecorrido, ActualizarRecorridoRequest req, CancellationToken ct) =>
        recorridos.ActualizarAsync(User.IdUsuario(), idRecorrido, req, ct);

    [HttpPut("{idRecorrido:int}/etapas")]
    [ProducesResponseType<RecorridoAdminDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<RecorridoAdminDetalleDto> ReemplazarEtapas(
        int idRecorrido, ReemplazarEtapasRecorridoRequest req, CancellationToken ct) =>
        recorridos.ReemplazarEtapasAsync(User.IdUsuario(), idRecorrido, req, ct);

    [HttpPost("{idRecorrido:int}/publicar")]
    [ProducesResponseType<RecorridoAdminDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<RecorridoAdminDetalleDto> Publicar(int idRecorrido, CancellationToken ct) =>
        recorridos.PublicarAsync(User.IdUsuario(), idRecorrido, ct);

    [HttpPost("{idRecorrido:int}/archivar")]
    [ProducesResponseType<RecorridoAdminDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<RecorridoAdminDetalleDto> Archivar(int idRecorrido, CancellationToken ct) =>
        recorridos.ArchivarAsync(User.IdUsuario(), idRecorrido, ct);
}
