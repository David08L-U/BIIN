using Biin.Application.Interfaces;

namespace Biin.Infrastructure.Security;

/// <summary>Hash seguro de contraseñas con BCrypt (RNF04).</summary>
public class BcryptHashContrasena : IHashContrasena
{
    private const int Costo = 11;

    public string Generar(string contrasena) => BCrypt.Net.BCrypt.HashPassword(contrasena, Costo);

    public bool Verificar(string contrasena, string hash) => BCrypt.Net.BCrypt.Verify(contrasena, hash);
}
