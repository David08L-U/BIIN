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

    private static string Clave(string jti) => Prefijo + jti.Trim();
}
