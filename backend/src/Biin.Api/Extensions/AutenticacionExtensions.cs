using System.Security.Claims;
using System.Text;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Biin.Api.Extensions;

public static class AutenticacionExtensions
{
    public static IServiceCollection AddAutenticacionJwt(this IServiceCollection services, IConfiguration config)
    {
        var jwt = config.GetSection(JwtOptions.Seccion).Get<JwtOptions>() ?? new JwtOptions();
        if (jwt.Clave.Length < 32)
            throw new InvalidOperationException(
                "Jwt:Clave debe tener al menos 32 caracteres. Configúrala en appsettings.Development.json.");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                o.MapInboundClaims = false;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Emisor,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audiencia,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Clave)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = JwtRegisteredClaimNames.Name,
                    RoleClaimType = ClaimTypes.Role
                };
            });

        services.AddAuthorization();
        return services;
    }

    /// <summary>Id del usuario autenticado, tomado del claim "sub" del token.</summary>
    public static int IdUsuario(this ClaimsPrincipal user) =>
        int.TryParse(user.FindFirstValue(JwtRegisteredClaimNames.Sub), out var id)
            ? id
            : throw new NoAutenticadoException("Token sin identificador de usuario.");

    /// <summary>Identificador único del token (claim "jti"), usado para revocación de sesión.</summary>
    public static string? Jti(this ClaimsPrincipal user) =>
        user.FindFirstValue(JwtRegisteredClaimNames.Jti);

    /// <summary>Fecha de expiración UTC del token (claim "exp").</summary>
    public static DateTime? ExpiraEnUtc(this ClaimsPrincipal user) =>
        long.TryParse(user.FindFirstValue(JwtRegisteredClaimNames.Exp), out var unixSeconds)
            ? DateTimeOffset.FromUnixTimeSeconds(unixSeconds).UtcDateTime
            : null;

    /// <summary>Lista de roles incluidos en el token del usuario.</summary>
    public static IReadOnlyList<string> RolesUsuario(this ClaimsPrincipal user) =>
        user.FindAll(ClaimTypes.Role).Select(c => c.Value).Distinct(StringComparer.Ordinal).ToList();

    /// <summary>Indica si el usuario cuenta con el rol indicado.</summary>
    public static bool TieneRol(this ClaimsPrincipal user, string rol) =>
        user.IsInRole(rol);

    /// <summary>Indica si el usuario tiene el rol de administrador.</summary>
    public static bool EsAdministrador(this ClaimsPrincipal user) =>
        user.IsInRole(Roles.Administrador);
}
