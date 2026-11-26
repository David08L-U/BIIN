using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Consulta pública de negocios gastronómicos (CU-05, RF05). No requiere sesión (RF01).</summary>
[ApiController]
[Route("api/negocios")]
[AllowAnonymous]
public class NegociosController(NegociosService negocios) : ControllerBase
{
    /// <summary>Lista negocios publicados filtrando por localidad, municipio, tipo de comida, presupuesto o texto.</summary>
    [HttpGet]
    [ProducesResponseType<PaginaResultado<NegocioResumenDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<PaginaResultado<NegocioResumenDto>> Listar([FromQuery] FiltroNegociosRequest filtro, CancellationToken ct) =>
        negocios.ListarAsync(filtro, ct);

    /// <summary>Ficha del negocio: ubicación, fotos, horarios, precios aproximados y si está abierto ahora.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType<NegocioDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<NegocioDetalleDto> Obtener(int id, CancellationToken ct) =>
        negocios.ObtenerAsync(id, ct);
}
