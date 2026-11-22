using Biin.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>Verifica en el backend la asignación operador-ruta (tabla operador_ruta, RF04/RNF04).</summary>
public class AutorizacionOperadorService(IAppDbContext db) : IAutorizacionOperador
{
    public Task<bool> PuedeOperarRutaAsync(int idUsuario, int idRuta, CancellationToken ct = default) =>
        db.OperadorRutas
            .AsNoTracking()
            .AnyAsync(or => or.IdUsuario == idUsuario && or.IdRuta == idRuta, ct);
}
