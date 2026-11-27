using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Consulta pública de recorridos sugeridos (CU-13, M2, RF01).</summary>
[ApiController]
[Route("api/recorridos")]
[AllowAnonymous]
public class RecorridosController(RecorridosService recorridos) : ControllerBase
{
    /// <summary>Lista paginada de recorridos sugeridos publicados, filtrables por localidad, municipio o texto sin acentos.</summary>
    [HttpGet]
    [ProducesResponseType<PaginaResultado<RecorridoResumenDto>>(StatusCodes.Status200OK)]
    public Task<PaginaResultado<RecorridoResumenDto>> Listar(
        [FromQuery] FiltroRecorridosRequest filtro,
        CancellationToken ct) =>
        recorridos.ListarAsync(filtro, ct);

    /// <summary>Detalle de un recorrido publicado con sus etapas ordenadas, coordenadas para mapa y estado de disponibilidad.</summary>
    [HttpGet("{idRecorrido:int}")]
    [ProducesResponseType<RecorridoDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<RecorridoDetalleDto> ObtenerPorId(int idRecorrido, CancellationToken ct) =>
        recorridos.ObtenerPorIdAsync(idRecorrido, ct);
}
