using Biin.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Biin.Api.Controllers;

/// <summary>Comprueba que la API está arriba y que llega a PostgreSQL.</summary>
[ApiController]
[Route("api/salud")]
public class SaludController(BiinDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var bdConectada = await db.Database.CanConnectAsync(ct);
        var roles = bdConectada ? await db.Roles.CountAsync(ct) : 0;

        var cuerpo = new { api = "ok", baseDeDatos = bdConectada ? "ok" : "sin conexión", roles };
        return bdConectada ? Ok(cuerpo) : StatusCode(StatusCodes.Status503ServiceUnavailable, cuerpo);
    }
}
