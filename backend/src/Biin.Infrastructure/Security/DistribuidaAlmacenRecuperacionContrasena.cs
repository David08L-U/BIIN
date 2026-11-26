using System.Text.Json;
using Biin.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace Biin.Infrastructure.Security;

/// <summary>
/// Guarda en <see cref="IDistributedCache"/> el estado temporal de recuperación de contraseña
/// (hash BCrypt del código, intentos y vencimiento) sin alterar el esquema SQL.
/// </summary>
public class DistribuidaAlmacenRecuperacionContrasena(IDistributedCache cache) : IAlmacenRecuperacionContrasena
{
    private const string Prefijo = "biin:auth:recuperacion:";

    public async Task<RecuperacionPendiente?> ObtenerAsync(string correoNormalizado, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(correoNormalizado))
            return null;

        var json = await cache.GetStringAsync(Clave(correoNormalizado), ct);
        return string.IsNullOrWhiteSpace(json)
            ? null
            : JsonSerializer.Deserialize<RecuperacionPendiente>(json);
    }

    public async Task GuardarAsync(RecuperacionPendiente pendiente, CancellationToken ct = default)
    {
        var expiraUtc = DateTime.SpecifyKind(pendiente.ExpiraEnUtc, DateTimeKind.Utc);
        var opciones = new DistributedCacheEntryOptions
        {
            AbsoluteExpiration = new DateTimeOffset(expiraUtc)
        };
        var json = JsonSerializer.Serialize(pendiente);
        await cache.SetStringAsync(Clave(pendiente.Correo), json, opciones, ct);
    }

    public Task EliminarAsync(string correoNormalizado, CancellationToken ct = default) =>
        string.IsNullOrWhiteSpace(correoNormalizado)
            ? Task.CompletedTask
            : cache.RemoveAsync(Clave(correoNormalizado), ct);

    private static string Clave(string correo) => Prefijo + correo.Trim().ToLowerInvariant();
}
