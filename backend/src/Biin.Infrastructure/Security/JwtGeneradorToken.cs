using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Biin.Infrastructure.Security;

public class JwtGeneradorToken(IOptions<JwtOptions> opciones) : IGeneradorToken
{
    private readonly JwtOptions _opt = opciones.Value;

    public (string Token, DateTime ExpiraEn) Generar(Usuario usuario, IEnumerable<string> roles)
    {
        var expira = DateTime.UtcNow.AddMinutes(_opt.MinutosExpiracion);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.IdUsuario.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Correo),
            new(JwtRegisteredClaimNames.Name, usuario.Nombre),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opt.Clave)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opt.Emisor,
            audience: _opt.Audiencia,
            claims: claims,
            expires: expira,
            signingCredentials: credenciales);

        return (new JwtSecurityTokenHandler().WriteToken(token), expira);
    }
}
