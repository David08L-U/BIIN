using Biin.Api.Configuration;
using Biin.Api.Extensions;
using Biin.Application.DTOs.Admin;
using Biin.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Controllers;

/// <summary>Administración de tarifas por tramo de ruta con control de vigencias y bitácora (RF12, CU-12, 17.1.5).</summary>
[ApiController]
[Route("api/admin/rutas/{idRuta:int}/tarifas")]
[Authorize(Policy = PoliticasAutorizacion.RequiereAdministrador)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class AdminTarifasController(AdminTarifasService tarifas) : ControllerBase
{
    /// <summary>Lista todas las tarifas (histórico y vigentes) de una ruta.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<TarifaAdminDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IReadOnlyList<TarifaAdminDto>> Listar(
        int idRuta,
        [FromQuery] bool soloVigentes = false,
        CancellationToken ct = default) =>
        tarifas.ListarPorRutaAsync(idRuta, soloVigentes, ct);

    /// <summary>Registra una nueva tarifa para un tramo de la ruta validando que no se solape con vigencias activas.</summary>
    [HttpPost]
    [ProducesResponseType<TarifaAdminDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TarifaAdminDto>> Crear(int idRuta, CrearTarifaRequest req, CancellationToken ct)
    {
        var creada = await tarifas.CrearAsync(User.IdUsuario(), idRuta, req, ct);
        return Created($"/api/admin/rutas/{idRuta}/tarifas", creada);
    }

    /// <summary>Actualiza el monto y/o fechas de vigencia de una tarifa existente.</summary>
    [HttpPut("{idTarifa:int}")]
    [ProducesResponseType<TarifaAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<TarifaAdminDto> Actualizar(int idRuta, int idTarifa, ActualizarTarifaRequest req, CancellationToken ct) =>
        tarifas.ActualizarAsync(User.IdUsuario(), idRuta, idTarifa, req, ct);

    /// <summary>Cierra la vigencia de una tarifa sin eliminar su registro histórico.</summary>
    [HttpPatch("{idTarifa:int}/cerrar-vigencia")]
    [ProducesResponseType<TarifaAdminDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<TarifaAdminDto> CerrarVigencia(
        int idRuta, int idTarifa, CerrarVigenciaTarifaRequest req, CancellationToken ct) =>
        tarifas.CerrarVigenciaAsync(User.IdUsuario(), idRuta, idTarifa, req, ct);
}
