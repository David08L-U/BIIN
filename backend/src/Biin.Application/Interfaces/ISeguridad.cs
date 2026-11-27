using Biin.Domain.Entities;

namespace Biin.Application.Interfaces;

public interface IHashContrasena
{
    string Generar(string contrasena);
    bool Verificar(string contrasena, string hash);
}

public interface IGeneradorToken
{
    /// <summary>Crea un JWT con el id, correo y roles del usuario.</summary>
    (string Token, DateTime ExpiraEn) Generar(Usuario usuario, IEnumerable<string> roles);
}

public interface IRevocacionToken
{
    /// <summary>Marca un token (jti) como revocado hasta su expiración UTC.</summary>
    void Revocar(string jti, DateTime expiraEnUtc);

    /// <summary>Indica si el token (jti) fue revocado antes de vencer.</summary>
    bool EstaRevocado(string jti);

    /// <summary>Revoca todos los tokens de un usuario emitidos hasta <paramref name="revocadoEnUtc"/>.</summary>
    void RevocarSesionesUsuario(int idUsuario, DateTime revocadoEnUtc, TimeSpan vigenciaMaxima);

    /// <summary>Indica si un token emitido en <paramref name="emitidoEnUtc"/> quedó invalidado por cierre global del usuario.</summary>
    bool SesionUsuarioRevocada(int idUsuario, DateTime emitidoEnUtc);
}

public interface IAutorizacionOperador
{
    /// <summary>Indica si el usuario está autorizado para operar la ruta en operador_ruta (RF04, RNF04).</summary>
    Task<bool> PuedeOperarRutaAsync(int idUsuario, int idRuta, CancellationToken ct = default);
}

/// <summary>Estado temporal de una solicitud de recuperación de contraseña (sin guardar el código en claro).</summary>
public record RecuperacionPendiente(
    int IdUsuario,
    string Correo,
    string HashCodigo,
    int Intentos,
    DateTime EnviadoEnUtc,
    DateTime ExpiraEnUtc);

/// <summary>Almacén temporal distribuible para códigos de recuperación de contraseña (RF01, RNF04).</summary>
public interface IAlmacenRecuperacionContrasena
{
    Task<RecuperacionPendiente?> ObtenerAsync(string correoNormalizado, CancellationToken ct = default);
    Task GuardarAsync(RecuperacionPendiente pendiente, CancellationToken ct = default);
    Task EliminarAsync(string correoNormalizado, CancellationToken ct = default);
}
