using Biin.Application.DTOs.Transporte;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Consulta pública de tarifas aproximadas vigentes por ruta y tramo (RF03, RNF07, CU-03).</summary>
[ApiController]
[Route("api/rutas/{idRuta:int}/tarifas")]
[AllowAnonymous]
public class TarifasController(TarifasService tarifas) : ControllerBase
{
    /// <summary>Devuelve las tarifas aproximadas vigentes de una ruta publicada (todas o filtradas por tramo/fecha).</summary>
    [HttpGet]
    [ProducesResponseType<TarifasRutaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<TarifasRutaResponse> ObtenerPorRuta(
        int idRuta,
        [FromQuery] FiltroTarifasRutaRequest filtro,
        CancellationToken ct) =>
        tarifas.ObtenerVigentesPorRutaAsync(idRuta, filtro, ct);
}
