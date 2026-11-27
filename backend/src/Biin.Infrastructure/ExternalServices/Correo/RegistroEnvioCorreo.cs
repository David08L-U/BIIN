using Biin.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Biin.Infrastructure.ExternalServices.Correo;

/// <summary>
/// Solo para desarrollo sin SMTP configurado: escribe el código en la consola de la API
/// en lugar de mandarlo, para poder probar el registro en local. Nunca se usa fuera de Development.
/// </summary>
public class RegistroEnvioCorreo(ILogger<RegistroEnvioCorreo> logger) : IEnvioCorreo
{
    public Task EnviarCodigoVerificacionAsync(
        string correo, string nombre, string codigo, DateTime expiraEnUtc, CancellationToken ct = default)
    {
        logger.LogWarning(
            "[DESARROLLO] Sin Correo:Servidor configurado. Código de registro para {Correo}: {Codigo} (vence {Expira:u}).",
            correo, codigo, expiraEnUtc);
        return Task.CompletedTask;
    }

    public Task EnviarCodigoRecuperacionAsync(
        string correo, string nombre, string codigo, DateTime expiraEnUtc, CancellationToken ct = default)
    {
        logger.LogWarning(
            "[DESARROLLO] Sin Correo:Servidor configurado. Código de recuperación para {Correo}: {Codigo} (vence {Expira:u}).",
            correo, codigo, expiraEnUtc);
        return Task.CompletedTask;
    }
}

/// <summary>Fuera de Development y sin SMTP: falla con un mensaje claro en lugar de fingir que envió el código.</summary>
public class SinConfigurarEnvioCorreo : IEnvioCorreo
{
    public Task EnviarCodigoVerificacionAsync(
        string correo, string nombre, string codigo, DateTime expiraEnUtc, CancellationToken ct = default) =>
        throw new InvalidOperationException(
            "Falta configurar Correo:Servidor (SMTP). Sin él no se pueden confirmar correos de viajeros.");

    public Task EnviarCodigoRecuperacionAsync(
        string correo, string nombre, string codigo, DateTime expiraEnUtc, CancellationToken ct = default) =>
        throw new InvalidOperationException(
            "Falta configurar Correo:Servidor (SMTP). Sin él no se pueden enviar códigos de recuperación.");
}
