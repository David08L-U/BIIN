using Biin.Api.Configuration;
using Biin.Api.Extensions;
using Biin.Application.DTOs.Itinerarios;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Mi Viaje: itinerarios del viajero registrado (CU-09, RF09). Cada usuario solo accede a los suyos.</summary>
[ApiController]
[Route("api/itinerarios")]
[Authorize(Policy = PoliticasAutorizacion.RequiereViajero)]
public class ItinerariosController(ItinerariosService itinerarios) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<ItinerarioResumenDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IReadOnlyList<ItinerarioResumenDto>> Listar(CancellationToken ct) =>
        itinerarios.ListarAsync(User.IdUsuario(), ct);

    /// <summary>Detalle con actividades en orden, traslados estimados y advertencias.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType<ItinerarioDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ItinerarioDetalleDto> Obtener(int id, CancellationToken ct) =>
        itinerarios.ObtenerAsync(User.IdUsuario(), id, ct);

    [HttpPost]
    [ProducesResponseType<ItinerarioDetalleDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ItinerarioDetalleDto>> Crear(CrearItinerarioRequest req, CancellationToken ct)
    {
        var creado = await itinerarios.CrearAsync(User.IdUsuario(), req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.IdItinerario }, creado);
    }

    /// <summary>Crea un itinerario editable copiando las etapas publicadas de un recorrido sugerido (CU-09, CU-13).</summary>
    [HttpPost("desde-recorrido/{idRecorrido:int}")]
    [ProducesResponseType<ItinerarioDetalleDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItinerarioDetalleDto>> CrearDesdeRecorrido(
        int idRecorrido,
        CrearItinerarioDesdeRecorridoRequest req,
        CancellationToken ct)
    {
        var creado = await itinerarios.CrearDesdeRecorridoAsync(User.IdUsuario(), idRecorrido, req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.IdItinerario }, creado);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType<ItinerarioDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ItinerarioDetalleDto> Actualizar(int id, ActualizarItinerarioRequest req, CancellationToken ct) =>
        itinerarios.ActualizarAsync(User.IdUsuario(), id, req, ct);

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await itinerarios.EliminarAsync(User.IdUsuario(), id, ct);
        return NoContent();
    }

    [HttpPost("{id:int}/actividades")]
    [ProducesResponseType<ItinerarioDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ItinerarioDetalleDto> AgregarActividad(int id, AgregarActividadRequest req, CancellationToken ct) =>
        itinerarios.AgregarActividadAsync(User.IdUsuario(), id, req, ct);

    [HttpPut("{id:int}/actividades/{idActividad:int}")]
    [ProducesResponseType<ItinerarioDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ItinerarioDetalleDto> ActualizarActividad(
        int id, int idActividad, ActualizarActividadRequest req, CancellationToken ct) =>
        itinerarios.ActualizarActividadAsync(User.IdUsuario(), id, idActividad, req, ct);

    [HttpDelete("{id:int}/actividades/{idActividad:int}")]
    [ProducesResponseType<ItinerarioDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ItinerarioDetalleDto> QuitarActividad(int id, int idActividad, CancellationToken ct) =>
        itinerarios.QuitarActividadAsync(User.IdUsuario(), id, idActividad, ct);

    /// <summary>Recibe todas las actividades en el nuevo orden.</summary>
    [HttpPut("{id:int}/actividades/orden")]
    [ProducesResponseType<ItinerarioDetalleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ItinerarioDetalleDto> Reordenar(int id, ReordenarActividadesRequest req, CancellationToken ct) =>
        itinerarios.ReordenarActividadesAsync(User.IdUsuario(), id, req, ct);
}
