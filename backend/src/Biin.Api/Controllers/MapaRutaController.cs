using Biin.Application.DTOs.Transporte;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Paradas ordenadas y trazo polyline de una ruta publicada para mapas Leaflet (RF03, CU-03).</summary>
[ApiController]
[Route("api/rutas/{idRuta:int}/mapa")]
[AllowAnonymous]
public class MapaRutaController(MapaRutaService mapaRuta) : ControllerBase
{
    /// <summary>Devuelve paradas ordenadas (con abordaje/descenso y coordenadas) y el trazo polyline de la ruta.</summary>
    [HttpGet]
    [ProducesResponseType<MapaRutaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<MapaRutaResponse> ObtenerMapa(int idRuta, CancellationToken ct) =>
        mapaRuta.ObtenerMapaAsync(idRuta, ct);
}
