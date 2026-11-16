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
