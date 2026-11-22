using Biin.Api.Configuration;
using Biin.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace Biin.Api.Extensions;

/// <summary>Registra las políticas de autorización por rol y por recurso en el backend (RNF04).</summary>
public static class AutorizacionExtensions
{
    public static IServiceCollection AddAutorizacionPorRoles(this IServiceCollection services)
    {
        services.AddScoped<IAuthorizationHandler, OperadorDeRutaHandler>();

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
                p.RequireAuthenticatedUser().RequireRole(Roles.Colaborador, Roles.Administrador))
            .AddPolicy(PoliticasAutorizacion.OperadorDeRuta, p =>
                p.RequireAuthenticatedUser()
                    .RequireRole(Roles.Operador)
                    .AddRequirements(new OperadorDeRutaRequirement()));

        return services;
    }
}
