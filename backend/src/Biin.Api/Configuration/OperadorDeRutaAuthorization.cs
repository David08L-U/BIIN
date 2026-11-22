using System.Security.Claims;
using Biin.Api.Extensions;
using Biin.Application.Interfaces;
using Biin.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Biin.Api.Configuration;

/// <summary>Requisito que comprueba que el operador autenticado tiene asignada una ruta específica.</summary>
public sealed class OperadorDeRutaRequirement : IAuthorizationRequirement;

/// <summary>
/// Evalúa <see cref="OperadorDeRutaRequirement"/> contra la tabla <c>operador_ruta</c>.
/// Uso en controladores o servicios: <c>authorizationService.AuthorizeAsync(User, idRuta, PoliticasAutorizacion.OperadorDeRuta)</c>.
/// </summary>
public sealed class OperadorDeRutaHandler(IAutorizacionOperador autorizacionOperador)
    : AuthorizationHandler<OperadorDeRutaRequirement, int>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        OperadorDeRutaRequirement requirement,
        int idRuta)
    {
        if (idRuta <= 0 || context.User.Identity?.IsAuthenticated != true)
            return;

        if (!context.User.TieneRol(Roles.Operador))
            return;

        if (!int.TryParse(context.User.FindFirstValue(JwtRegisteredClaimNames.Sub), out var idUsuario))
            return;

        if (await autorizacionOperador.PuedeOperarRutaAsync(idUsuario, idRuta))
            context.Succeed(requirement);
    }
}
