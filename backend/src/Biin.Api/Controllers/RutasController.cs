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

    /// <summary>Detalle completo de una ruta publicada: paradas, trazo, horarios, tarifas, regreso y salidas (RF03, CU-03).</summary>
    [HttpGet("{idRuta:int}")]
    [ProducesResponseType<RutaDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<RutaDetalleDto> Detalle(int idRuta, [FromQuery] short? diaSemana = null, CancellationToken ct = default) =>
        rutas.ObtenerDetalleAsync(idRuta, diaSemana, ct);

    /// <summary>Salidas programadas de una ruta para una fecha (hoy en Yucatán por defecto) con estado de cupo (RF03, RF04, RNF07).</summary>
    [HttpGet("{idRuta:int}/salidas")]
    [ProducesResponseType<SalidasRutaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<SalidasRutaResponse> Salidas(int idRuta, [FromQuery] DateOnly? fecha = null, CancellationToken ct = default) =>
        rutas.ObtenerSalidasAsync(idRuta, fecha, ct);
}
