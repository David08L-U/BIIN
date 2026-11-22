using Biin.Api.Configuration;
using Biin.Domain.Enums;

namespace Biin.Api.Extensions;

/// <summary>Registra las políticas de autorización por rol en el backend (RNF04).</summary>
public static class AutorizacionExtensions
{
    public static IServiceCollection AddAutorizacionPorRoles(this IServiceCollection services)
    {
        services.AddAuthorizationBuilder()
            .AddPolicy(PoliticasAutorizacion.RequiereViajero, p =>
                p.RequireAuthenticatedUser().RequireRole(Roles.Viajero))
            .AddPolicy(PoliticasAutorizacion.RequiereOperador, p =>
                p.RequireAuthenticatedUser().RequireRole(Roles.Operador))
            .AddPolicy(PoliticasAutorizacion.RequiereAdministrador, p =>
                p.RequireAuthenticatedUser().RequireRole(Roles.Administrador))
            .AddPolicy(PoliticasAutorizacion.RequiereOperadorOAdministrador, p =>
                p.RequireAuthenticatedUser().RequireRole(Roles.Operador, Roles.Administrador))
            .AddPolicy(PoliticasAutorizacion.RequiereColaboradorOAdministrador, p =>
                p.RequireAuthenticatedUser().RequireRole(Roles.Colaborador, Roles.Administrador));

        return services;
    }
}
