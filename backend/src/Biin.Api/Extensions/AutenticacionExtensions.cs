using System.Security.Claims;
using System.Text;
using Biin.Application.Interfaces;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

                o.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var principal = context.Principal;
                        if (principal is null)
                        {
                            context.Fail(new NoAutenticadoException("El token de acceso no es válido."));
                            return;
                        }

                        var revocacion = context.HttpContext.RequestServices
                            .GetRequiredService<IRevocacionToken>();
                        var jti = principal.Jti();
                        if (!string.IsNullOrWhiteSpace(jti) && revocacion.EstaRevocado(jti))
                        {
                            context.Fail(new NoAutenticadoException("La sesión fue cerrada. Inicia sesión nuevamente."));
                            return;
                        }

                        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
                        if (!int.TryParse(sub, out var idUsuario))
                        {
                            context.Fail(new NoAutenticadoException("Token sin identificador de usuario."));
                            return;
                        }

                        var emitidoEnUtc = principal.EmitidoEnUtc();
                        if (emitidoEnUtc.HasValue && revocacion.SesionUsuarioRevocada(idUsuario, emitidoEnUtc.Value))
                        {
                            context.Fail(new NoAutenticadoException("La sesión fue cerrada. Inicia sesión nuevamente."));
                            return;
                        }

                        var db = context.HttpContext.RequestServices.GetRequiredService<IAppDbContext>();
                        var activo = await db.Usuarios
                            .AsNoTracking()
                            .Where(u => u.IdUsuario == idUsuario)
                            .Select(u => (bool?)u.Activo)
                            .SingleOrDefaultAsync(context.HttpContext.RequestAborted);

                        if (activo is null)
                        {
                            context.Fail(new NoAutenticadoException("La cuenta ya no existe."));
                            return;
                        }

                        if (!activo.Value)
                        {
                            context.Fail(new NoAutenticadoException("La cuenta está desactivada."));
                        }
                    },
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        if (context.Response.HasStarted)
                            return;

                        var detalle = ObtenerDetalleNoAutenticado(context);

                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        await context.Response.WriteAsJsonAsync(new ProblemDetails
                        {
                            Status = StatusCodes.Status401Unauthorized,
                            Title = "No autenticado",
                            Detail = detalle,
                            Instance = context.Request.Path
                        }, options: null, contentType: "application/problem+json");
                    },
                    OnForbidden = async context =>
                    {
                        if (context.Response.HasStarted)
                            return;

                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new ProblemDetails
                        {
                            Status = StatusCodes.Status403Forbidden,
                            Title = "Acceso denegado",
                            Detail = "No tienes permisos suficientes para realizar esta acción.",
                            Instance = context.Request.Path
                        }, options: null, contentType: "application/problem+json");
                    }
                };
            });

        return services;
    }

    private static string ObtenerDetalleNoAutenticado(JwtBearerChallengeContext context) =>
        context.AuthenticateFailure switch
        {
            NoAutenticadoException ex => ex.Message,
            SecurityTokenExpiredException => "La sesión expiró. Inicia sesión nuevamente.",
            not null => "El token de acceso no es válido.",
            null => "Se requiere iniciar sesión para acceder a este recurso."
        };

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

    /// <summary>Fecha de emisión UTC del token (claim "iat"), usada para revocación global por usuario.</summary>
    public static DateTime? EmitidoEnUtc(this ClaimsPrincipal user) =>
        long.TryParse(user.FindFirstValue(JwtRegisteredClaimNames.Iat), out var unixSeconds)
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
