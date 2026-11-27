using Biin.Application.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace Biin.Infrastructure.Security;

/// <summary>
/// Lista en memoria de tokens JWT revocados por jti hasta su expiración.
/// Evita agregar tablas fuera del modelo relacional de 30 tablas.
/// </summary>
public class MemoriaRevocacionToken(IMemoryCache cache) : IRevocacionToken
{
    private const string Prefijo = "jwt:revocado:";
    private static readonly TimeSpan MargenReloj = TimeSpan.FromMinutes(1);

    public void Revocar(string jti, DateTime expiraEnUtc)
    {
        if (string.IsNullOrWhiteSpace(jti))
            return;

        var expiraUtc = DateTime.SpecifyKind(expiraEnUtc, DateTimeKind.Utc);
        var expiraConMargen = expiraUtc.Add(MargenReloj);
        if (expiraConMargen <= DateTime.UtcNow)
            return;

        cache.Set(
            Clave(jti),
            true,
            new MemoryCacheEntryOptions
            {
                AbsoluteExpiration = new DateTimeOffset(expiraConMargen)
            });
    }

    public bool EstaRevocado(string jti) =>
        !string.IsNullOrWhiteSpace(jti) && cache.TryGetValue(Clave(jti), out _);

    public void RevocarSesionesUsuario(int idUsuario, DateTime revocadoEnUtc, TimeSpan vigenciaMaxima)
    {
        if (idUsuario <= 0 || vigenciaMaxima <= TimeSpan.Zero)
            return;

        var corteUtc = DateTime.SpecifyKind(revocadoEnUtc, DateTimeKind.Utc);
        cache.Set(
            ClaveUsuario(idUsuario),
            corteUtc.Ticks,
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = vigenciaMaxima.Add(MargenReloj)
            });
    }

    public bool SesionUsuarioRevocada(int idUsuario, DateTime emitidoEnUtc)
    {
        if (idUsuario <= 0 || !cache.TryGetValue<long>(ClaveUsuario(idUsuario), out var corteTicks))
            return false;

        var emitidoUtc = DateTime.SpecifyKind(emitidoEnUtc, DateTimeKind.Utc);
        return emitidoUtc.Ticks <= corteTicks;
    }

    private static string Clave(string jti) => Prefijo + jti.Trim();
    private static string ClaveUsuario(int idUsuario) => $"jwt:usuario:{idUsuario}:desde";
}
