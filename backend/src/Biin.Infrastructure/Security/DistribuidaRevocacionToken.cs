using Biin.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace Biin.Infrastructure.Security;

/// <summary>
/// Almacén de revocación de JWT sobre <see cref="IDistributedCache"/> (RF01, RNF04).
/// En una sola instancia usa caché distribuida en memoria sin dependencias externas;
/// en despliegues con múltiples nodos basta registrar Redis u otro <see cref="IDistributedCache"/> compartido
/// sin cambiar la capa de negocio ni agregar tablas fuera del modelo relacional.
/// </summary>
public class DistribuidaRevocacionToken(IDistributedCache cache) : IRevocacionToken
{
    private const string PrefijoJti = "biin:jwt:revocado:";
    private const string PrefijoUsuario = "biin:jwt:usuario:";
    private static readonly TimeSpan MargenReloj = TimeSpan.FromMinutes(1);
    private static readonly byte[] Marcador = [1];

    public void Revocar(string jti, DateTime expiraEnUtc)
    {
        if (string.IsNullOrWhiteSpace(jti))
            return;

        var expiraUtc = DateTime.SpecifyKind(expiraEnUtc, DateTimeKind.Utc);
        var expiraConMargen = expiraUtc.Add(MargenReloj);
        if (expiraConMargen <= DateTime.UtcNow)
            return;

        cache.Set(
            ClaveJti(jti),
            Marcador,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = new DateTimeOffset(expiraConMargen)
            });
    }

    public bool EstaRevocado(string jti) =>
        !string.IsNullOrWhiteSpace(jti) && cache.Get(ClaveJti(jti)) is not null;

    public void RevocarSesionesUsuario(int idUsuario, DateTime revocadoEnUtc, TimeSpan vigenciaMaxima)
    {
        if (idUsuario <= 0 || vigenciaMaxima <= TimeSpan.Zero)
            return;

        var corteUtc = DateTime.SpecifyKind(revocadoEnUtc, DateTimeKind.Utc);
        cache.Set(
            ClaveUsuario(idUsuario),
            BitConverter.GetBytes(corteUtc.Ticks),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = vigenciaMaxima.Add(MargenReloj)
            });
    }

    public bool SesionUsuarioRevocada(int idUsuario, DateTime emitidoEnUtc)
    {
        if (idUsuario <= 0)
            return false;

        var bytes = cache.Get(ClaveUsuario(idUsuario));
        if (bytes is null || bytes.Length != sizeof(long))
            return false;

        var corteTicks = BitConverter.ToInt64(bytes, 0);
        var emitidoUtc = DateTime.SpecifyKind(emitidoEnUtc, DateTimeKind.Utc);
        return emitidoUtc.Ticks <= corteTicks;
    }

    private static string ClaveJti(string jti) => PrefijoJti + jti.Trim();
    private static string ClaveUsuario(int idUsuario) => $"{PrefijoUsuario}{idUsuario}:desde";
}
