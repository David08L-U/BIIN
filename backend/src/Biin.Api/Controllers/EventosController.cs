using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Cartelera pública de eventos (CU-06, RF06). No requiere sesión (RF01).</summary>
[ApiController]
[Route("api/eventos")]
[AllowAnonymous]
public class EventosController(EventosService eventos) : ControllerBase
{
    /// <summary>
    /// Lista eventos publicados. Fechas <c>desde</c>/<c>hasta</c> en formato yyyy-MM-dd (hora de Yucatán);
    /// <c>estado</c> acepta programado, cancelado o finalizado.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<PaginaResultado<EventoResumenDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<PaginaResultado<EventoResumenDto>> Listar([FromQuery] FiltroEventosRequest filtro, CancellationToken ct) =>
        eventos.ListarAsync(filtro, ct);

    [HttpGet("{id:int}")]
    [ProducesResponseType<EventoDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<EventoDetalleDto> Obtener(int id, CancellationToken ct) =>
        eventos.ObtenerAsync(id, ct);
}
