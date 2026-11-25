using Biin.Application.DTOs.Catalogos;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Catálogos públicos para filtros: categorías, municipios y localidades (RF01, CU-14).</summary>
[ApiController]
[Route("api/catalogos")]
[AllowAnonymous]
public class CatalogosController(CatalogosService catalogos) : ControllerBase
{
    /// <summary>Categorías con el número de negocios, eventos y lugares publicados en cada una.</summary>
    [HttpGet("categorias")]
    [ProducesResponseType<IReadOnlyList<CategoriaDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<CategoriaDto>> Categorias(CancellationToken ct) =>
        catalogos.ListarCategoriasAsync(ct);

    [HttpGet("municipios")]
    [ProducesResponseType<IReadOnlyList<MunicipioDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<MunicipioDto>> Municipios(CancellationToken ct) =>
        catalogos.ListarMunicipiosAsync(ct);

    /// <summary>Localidades (máximo 50), filtradas por municipio o por texto sin importar acentos.</summary>
    [HttpGet("localidades")]
    [ProducesResponseType<IReadOnlyList<LocalidadDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<LocalidadDto>> Localidades(
        [FromQuery] int? idMunicipio,
        [FromQuery] string? busqueda,
        CancellationToken ct) =>
        catalogos.ListarLocalidadesAsync(idMunicipio, busqueda, ct);
}
