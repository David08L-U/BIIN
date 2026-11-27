using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Consulta pública de lugares de interés (CU-07, RF07). No requiere sesión (RF01).</summary>
[ApiController]
[Route("api/lugares")]
[AllowAnonymous]
public class LugaresController(LugaresService lugares) : ControllerBase
{
    /// <summary>Lista lugares publicados por localidad, municipio, categoría, costo máximo, texto o cercanía GPS opcional.</summary>
    [HttpGet]
    [ProducesResponseType<PaginaResultado<LugarResumenDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<PaginaResultado<LugarResumenDto>> Listar([FromQuery] FiltroLugaresRequest filtro, CancellationToken ct) =>
        lugares.ListarAsync(filtro, ct);

    /// <summary>Ficha del lugar con ubicación, descripción, horarios y condiciones de acceso.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType<LugarDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<LugarDetalleDto> Obtener(int id, CancellationToken ct) =>
        lugares.ObtenerAsync(id, ct);
}
