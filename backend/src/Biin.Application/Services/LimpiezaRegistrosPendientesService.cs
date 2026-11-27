using Biin.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Biin.Application.Services;

/// <summary>
/// Elimina en lotes los registros pendientes de verificación cuyo código ya expiró (RF01, RNF04).
/// </summary>
public class LimpiezaRegistrosPendientesService(
    IAppDbContext db,
    IReloj reloj,
    IOptions<VerificacionCorreoOptions> opciones)
{
    private readonly VerificacionCorreoOptions _opciones = opciones.Value;

    public async Task<int> LimpiarVencidosAsync(CancellationToken ct = default)
    {
        var limite = Math.Clamp(_opciones.LoteLimpieza, 1, 1000);
        var ahora = reloj.AhoraUtc;

        var vencidos = await db.RegistrosPendientes
            .Where(r => r.ExpiraEn <= ahora)
            .OrderBy(r => r.ExpiraEn)
            .Take(limite)
            .ToListAsync(ct);

        if (vencidos.Count == 0)
            return 0;

        foreach (var registro in vencidos)
            db.RegistrosPendientes.Remove(registro);

        await db.SaveChangesAsync(ct);
        return vencidos.Count;
    }
}
