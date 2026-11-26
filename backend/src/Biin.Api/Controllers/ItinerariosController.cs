using Biin.Api.Extensions;
using Biin.Application.DTOs.Itinerarios;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>RF09/HU09: guardados del usuario autenticado, sin aceptar propietario desde el cliente.</summary>
[ApiController]
[Authorize]
[Route("api/itinerarios")]
public sealed class ItinerariosController(ItinerarioService itinerarios) : ControllerBase
{
    [HttpGet("anteriores")]
    public Task<IReadOnlyList<ItinerarioAnteriorDto>> ListarAnteriores(CancellationToken ct) =>
        itinerarios.ListarAnterioresAsync(User.IdUsuario(), ct);

    [HttpGet]
    public Task<IReadOnlyList<ItinerarioDto>> Listar(CancellationToken ct) =>
        itinerarios.ListarAsync(User.IdUsuario(), ct);

    [HttpGet("{id:int}")]
    public Task<ItinerarioDto> Obtener(int id, CancellationToken ct) =>
        itinerarios.ObtenerAsync(User.IdUsuario(), id, ct);

    [HttpPost]
    public async Task<IActionResult> Crear(GuardarItinerarioRequest request, CancellationToken ct)
    {
        var (itinerario, creado) = await itinerarios.CrearAsync(User.IdUsuario(), request, ct);
        return creado
            ? CreatedAtAction(nameof(Obtener), new { id = itinerario.IdItinerario }, itinerario)
            : Ok(itinerario);
    }

    [HttpPut("{id:int}")]
    public Task<ItinerarioDto> Actualizar(int id, GuardarItinerarioRequest request, CancellationToken ct) =>
        itinerarios.ActualizarAsync(User.IdUsuario(), id, request, ct);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await itinerarios.EliminarAsync(User.IdUsuario(), id, ct);
        return NoContent();
    }
}
