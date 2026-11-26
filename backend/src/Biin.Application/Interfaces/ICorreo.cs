using Biin.Application.DTOs.Admin;

namespace Biin.Application.Interfaces;

/// <summary>Envía los correos de la plataforma; lo implementa Infrastructure (SMTP o registro en desarrollo).</summary>
public interface IEnvioCorreo
{
    /// <summary>
    /// Manda al viajero el código para confirmar su correo (RF01, CU-01).
    /// Si el buzón no existe, el correo no llega y la cuenta nunca se crea.
    /// </summary>
    Task EnviarCodigoVerificacionAsync(
        string correo, string nombre, string codigo, DateTime expiraEnUtc, CancellationToken ct = default);

    /// <summary>Manda un código de un solo uso para restablecer la contraseña olvidada (RF01, CU-01).</summary>
    Task EnviarCodigoRecuperacionAsync(
        string correo, string nombre, string codigo, DateTime expiraEnUtc, CancellationToken ct = default);
}

/// <summary>Permite a administradores comprobar la configuración SMTP y disparar un envío real de prueba (RF01, RNF08).</summary>
public interface IDiagnosticoCorreo
{
    EstadoCorreoDto ObtenerEstado();
    Task<PruebaCorreoResultadoDto> EnviarCorreoPruebaAsync(string correoDestino, CancellationToken ct = default);
}

/// <summary>Comprueba que el dominio de un correo pueda recibir mensajes (registros MX o, en su defecto, A/AAAA).</summary>
public interface IValidadorDominioCorreo
{
    /// <summary>
    /// false solo cuando el dominio seguro no recibe correo (no existe o no tiene servidor).
    /// Ante un error de red devuelve true: la confirmación por código sigue protegiendo el registro.
    /// </summary>
    Task<bool> PuedeRecibirCorreoAsync(string dominio, CancellationToken ct = default);
}
