using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Explorar turismo por interés (CU-14). No requiere sesión (RF01).</summary>
[ApiController]
[Route("api/explorar")]
[AllowAnonymous]
public class ExplorarController(ExplorarService explorar) : ControllerBase
{
    /// <summary>
    /// Negocios, eventos y lugares publicados de una categoría (idCategoria), opcionalmente de un
    /// tipo (negocio, evento, lugar), localidad, municipio o texto. Omite eventos que ya terminaron.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<PaginaResultado<RecursoExploradoDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<PaginaResultado<RecursoExploradoDto>> Explorar([FromQuery] FiltroExplorarRequest filtro, CancellationToken ct) =>
        explorar.ExplorarAsync(filtro, ct);
}
