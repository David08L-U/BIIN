using System.Globalization;
using Biin.Application.Interfaces;
using DnsClient;
using DnsClient.Protocol;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Biin.Infrastructure.ExternalServices.Correo;

/// <summary>
/// Revisa por DNS que el dominio del correo tenga servidor de correo (MX) o, si no lo declara,
/// una dirección A/AAAA (RFC 5321 §5.1). Rechaza dominios inexistentes y el "MX nulo" de RFC 7505.
/// Las respuestas se guardan una hora para no consultar el DNS en cada registro.
/// </summary>
public class DnsValidadorDominioCorreo(
    ILookupClient dns,
    IMemoryCache cache,
    ILogger<DnsValidadorDominioCorreo> logger) : IValidadorDominioCorreo
{
    private static readonly IdnMapping Idn = new();
    private static readonly TimeSpan Duracion = TimeSpan.FromHours(1);

    public async Task<bool> PuedeRecibirCorreoAsync(string dominio, CancellationToken ct = default)
    {
        string ascii;
        try
        {
            ascii = Idn.GetAscii(dominio.Trim().TrimEnd('.')).ToLowerInvariant();
        }
        catch (ArgumentException)
        {
            return false;
        }
        if (!ascii.Contains('.')) return false;

        var clave = $"dominio-correo:{ascii}";
        if (cache.TryGetValue(clave, out bool guardado)) return guardado;

        bool? resultado;
        try
        {
            resultado = await ConsultarAsync(ascii, ct);
        }
        catch (DnsResponseException ex)
        {
            // Sin red o DNS caído: no se bloquea el registro, el código por correo sigue siendo obligatorio
            logger.LogWarning(ex, "No se pudo consultar el DNS de {Dominio}; se acepta y se confirma por código", ascii);
            return true;
        }

        if (resultado is null) return true;
        cache.Set(clave, resultado.Value, Duracion);
        return resultado.Value;
    }

    /// <summary>true si recibe correo, false si seguro no, null si la respuesta no permite decidir.</summary>
    private async Task<bool?> ConsultarAsync(string dominio, CancellationToken ct)
    {
        var mx = await dns.QueryAsync(dominio, QueryType.MX, cancellationToken: ct);
        if (mx.Header.ResponseCode == DnsHeaderResponseCode.NotExistentDomain) return false;
        if (mx.HasError) return null;

        var servidores = mx.Answers.MxRecords().ToList();
        if (servidores.Count > 0)
            // MX nulo (RFC 7505): "0 ." declara que el dominio no acepta correo
            return !servidores.All(r => r.Exchange.Value is "." or "");

        // Sin MX: el correo va a la dirección del propio dominio si existe
        foreach (var tipo in new[] { QueryType.A, QueryType.AAAA })
        {
            var direccion = await dns.QueryAsync(dominio, tipo, cancellationToken: ct);
            if (!direccion.HasError && direccion.Answers.OfType<AddressRecord>().Any()) return true;
        }
        return false;
    }
}
