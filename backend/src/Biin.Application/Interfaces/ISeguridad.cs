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
}

public interface IAutorizacionOperador
{
    /// <summary>Indica si el usuario está autorizado para operar la ruta en operador_ruta (RF04, RNF04).</summary>
    Task<bool> PuedeOperarRutaAsync(int idUsuario, int idRuta, CancellationToken ct = default);
}
