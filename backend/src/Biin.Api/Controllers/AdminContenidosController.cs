using Biin.Api.Configuration;
using Biin.Api.Extensions;
using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Comun;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Gestión de negocios, eventos y lugares por el administrador (CU-12, RF12, RNF04).</summary>
[ApiController]
[Route("api/admin/contenidos")]
[Authorize(Policy = PoliticasAutorizacion.RequiereAdministrador)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class AdminContenidosController(AdminContenidosService contenidos) : ControllerBase
{
    /// <summary>Lista contenidos en cualquier estado (pendiente, publicado, archivado).</summary>
    [HttpGet]
    [ProducesResponseType<PaginaResultado<ContenidoAdminDto>>(StatusCodes.Status200OK)]
    public Task<PaginaResultado<ContenidoAdminDto>> Listar([FromQuery] FiltroContenidosAdminRequest filtro, CancellationToken ct) =>
        contenidos.ListarAsync(filtro, ct);

    [HttpGet("{id:int}")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ContenidoAdminDto> Obtener(int id, CancellationToken ct) =>
        contenidos.ObtenerAsync(id, ct);

    [HttpPost("negocios")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ContenidoAdminDto>> CrearNegocio(GuardarNegocioRequest req, CancellationToken ct) =>
        Creado(await contenidos.CrearNegocioAsync(User.IdUsuario(), req, ct));

    [HttpPut("negocios/{id:int}")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ContenidoAdminDto> ActualizarNegocio(int id, GuardarNegocioRequest req, CancellationToken ct) =>
        contenidos.ActualizarNegocioAsync(User.IdUsuario(), id, req, ct);

    [HttpPost("lugares")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ContenidoAdminDto>> CrearLugar(GuardarLugarRequest req, CancellationToken ct) =>
        Creado(await contenidos.CrearLugarAsync(User.IdUsuario(), req, ct));

    [HttpPut("lugares/{id:int}")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ContenidoAdminDto> ActualizarLugar(int id, GuardarLugarRequest req, CancellationToken ct) =>
        contenidos.ActualizarLugarAsync(User.IdUsuario(), id, req, ct);

    [HttpPost("eventos")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ContenidoAdminDto>> CrearEvento(GuardarEventoRequest req, CancellationToken ct) =>
        Creado(await contenidos.CrearEventoAsync(User.IdUsuario(), req, ct));

    [HttpPut("eventos/{id:int}")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ContenidoAdminDto> ActualizarEvento(int id, GuardarEventoRequest req, CancellationToken ct) =>
        contenidos.ActualizarEventoAsync(User.IdUsuario(), id, req, ct);

    /// <summary>Programado, cancelado o finalizado (independiente de la publicación).</summary>
    [HttpPatch("eventos/{id:int}/estado")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ContenidoAdminDto> CambiarEstadoEvento(int id, CambiarEstadoEventoRequest req, CancellationToken ct) =>
        contenidos.CambiarEstadoEventoAsync(User.IdUsuario(), id, req, ct);

    [HttpPost("{id:int}/publicar")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ContenidoAdminDto> Publicar(int id, CancellationToken ct) =>
        contenidos.PublicarAsync(User.IdUsuario(), id, ct);

    /// <summary>Retira el contenido sin borrarlo.</summary>
    [HttpPost("{id:int}/archivar")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ContenidoAdminDto> Archivar(int id, CancellationToken ct) =>
        contenidos.ArchivarAsync(User.IdUsuario(), id, ct);

    [HttpPut("{id:int}/horarios")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ContenidoAdminDto> ReemplazarHorarios(int id, ReemplazarHorariosRequest req, CancellationToken ct) =>
        contenidos.ReemplazarHorariosAsync(User.IdUsuario(), id, req, ct);

    [HttpPost("{id:int}/fotografias")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ContenidoAdminDto> AgregarFotografia(int id, AgregarFotografiaRequest req, CancellationToken ct) =>
        contenidos.AgregarFotografiaAsync(User.IdUsuario(), id, req, ct);

    [HttpDelete("{id:int}/fotografias/{idFotografia:int}")]
    [ProducesResponseType<ContenidoAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ContenidoAdminDto> QuitarFotografia(int id, int idFotografia, CancellationToken ct) =>
        contenidos.QuitarFotografiaAsync(User.IdUsuario(), id, idFotografia, ct);

    private CreatedAtActionResult Creado(ContenidoAdminDto dto) =>
        CreatedAtAction(nameof(Obtener), new { id = dto.IdRecurso }, dto);
}
