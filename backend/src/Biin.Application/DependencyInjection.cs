using Biin.Application.Interfaces;
using Biin.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Biin.Application;

public static class DependencyInjection
{
    /// <summary>Registra los servicios de negocio. Agrega aquí cada servicio nuevo.</summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<IAutorizacionOperador, AutorizacionOperadorService>();
        return services;
    }
}
