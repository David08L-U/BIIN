using Biin.Application.DTOs.Transporte;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Localidades y paradas de abordaje cercanas a la ubicación actual del viajero (RF02, RNF05).</summary>
[ApiController]
[Route("api/ubicaciones")]
[AllowAnonymous]
public class UbicacionesController(UbicacionesService ubicaciones) : ControllerBase
{
    /// <summary>
    /// Devuelve las localidades y paradas activas que permiten abordar dentro del radio indicado,
    /// ordenadas de menor a mayor distancia (Haversine).
    /// </summary>
    [HttpGet("cercanas")]
    [ProducesResponseType<UbicacionesCercanasResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<UbicacionesCercanasResponse> Cercanas(
        [FromQuery] FiltroUbicacionesCercanasRequest filtro,
        CancellationToken ct) =>
        ubicaciones.BuscarCercanasAsync(filtro, ct);
}
