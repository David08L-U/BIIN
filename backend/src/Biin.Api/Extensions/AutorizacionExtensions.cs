using System.Security.Claims;
using Biin.Api.Configuration;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
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

    /// <summary>
    /// Comprueba si el usuario autenticado puede operar la ruta indicada;
    /// si no está autorizado lanza <see cref="AccesoDenegadoException"/> (HTTP 403).
    /// </summary>
    public static async Task AsegurarOperadorDeRutaAsync(
        this IAuthorizationService autorizacion,
        ClaimsPrincipal usuario,
        int idRuta)
    {
        var resultado = await autorizacion.AuthorizeAsync(usuario, idRuta, PoliticasAutorizacion.OperadorDeRuta);
        if (!resultado.Succeeded)
            throw new AccesoDenegadoException("No estás autorizado para operar esta ruta.");
    }
}
