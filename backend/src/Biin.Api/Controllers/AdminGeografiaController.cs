using Biin.Api.Configuration;
using Biin.Api.Extensions;
using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Catalogos;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Localidades, ubicaciones y bitácora para el administrador (CU-12, paquete 17.1.5, RNF04).</summary>
[ApiController]
[Route("api/admin")]
[Authorize(Policy = PoliticasAutorizacion.RequiereAdministrador)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class AdminGeografiaController(AdminGeografiaService geografia, BitacoraConsultaService bitacora) : ControllerBase
{
    [HttpPost("localidades")]
    [ProducesResponseType<LocalidadDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LocalidadDto>> CrearLocalidad(CrearLocalidadRequest req, CancellationToken ct)
    {
        var creada = await geografia.CrearLocalidadAsync(User.IdUsuario(), req, ct);
        return Created($"/api/catalogos/localidades?idMunicipio={creada.IdMunicipio}", creada);
    }

    [HttpPut("localidades/{idLocalidad:int}")]
    [ProducesResponseType<LocalidadDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<LocalidadDto> ActualizarLocalidad(int idLocalidad, ActualizarLocalidadRequest req, CancellationToken ct) =>
        geografia.ActualizarLocalidadAsync(User.IdUsuario(), idLocalidad, req, ct);

    [HttpGet("localidades/{idLocalidad:int}/ubicaciones")]
    [ProducesResponseType<IReadOnlyList<UbicacionDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<UbicacionDto>> ListarUbicaciones(int idLocalidad, CancellationToken ct) =>
        geografia.ListarUbicacionesAsync(idLocalidad, ct);

    [HttpPost("ubicaciones")]
    [ProducesResponseType<UbicacionDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UbicacionDto>> CrearUbicacion(CrearUbicacionRequest req, CancellationToken ct)
    {
        var creada = await geografia.CrearUbicacionAsync(User.IdUsuario(), req, ct);
        return Created($"/api/admin/localidades/{creada.IdLocalidad}/ubicaciones", creada);
    }

    [HttpPut("ubicaciones/{idUbicacion:int}")]
    [ProducesResponseType<UbicacionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<UbicacionDto> ActualizarUbicacion(int idUbicacion, ActualizarUbicacionRequest req, CancellationToken ct) =>
        geografia.ActualizarUbicacionAsync(User.IdUsuario(), idUbicacion, req, ct);

    /// <summary>Bitácora de cambios administrativos, de lo más reciente a lo más antiguo.</summary>
    [HttpGet("bitacora")]
    [ProducesResponseType<PaginaResultado<BitacoraDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<PaginaResultado<BitacoraDto>> Bitacora([FromQuery] FiltroBitacoraRequest filtro, CancellationToken ct) =>
        bitacora.ListarAsync(filtro, ct);
}
