using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Transporte;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Consulta pública de rutas de combis intermunicipales (RF02, RF03, CU-02, CU-03, RNF05).</summary>
[ApiController]
[Route("api/rutas")]
[AllowAnonymous]
public class RutasController(RutasService rutas) : ControllerBase
{
    /// <summary>
    /// Busca rutas activas y publicadas filtrando por origen, destino (respetando orden de paradas y abordar/descender),
    /// día de la semana o texto libre. Sin coincidencias devuelve una lista vacía (200).
    /// </summary>
    [HttpGet]
    [ProducesResponseType<PaginaResultado<RutaResumenDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<PaginaResultado<RutaResumenDto>> Buscar([FromQuery] FiltroRutasRequest filtro, CancellationToken ct) =>
        rutas.BuscarAsync(filtro, ct);

    /// <summary>Rutas activas con paradas de abordaje cercanas a la ubicación actual del viajero (RNF05).</summary>
    [HttpGet("cercanas")]
    [ProducesResponseType<IReadOnlyList<RutaCercanaDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<IReadOnlyList<RutaCercanaDto>> Cercanas([FromQuery] FiltroRutasCercanasRequest filtro, CancellationToken ct) =>
        rutas.BuscarCercanasAsync(filtro, ct);
}
