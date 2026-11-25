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
        services.AddScoped<UsuariosService>();
        services.AddScoped<AdminUsuariosService>();
        services.AddScoped<IAutorizacionOperador, AutorizacionOperadorService>();
        services.AddScoped<IBitacoraAdmin, BitacoraAdminService>();
        services.AddScoped<CatalogosService>();
        services.AddScoped<NegociosService>();
        services.AddScoped<EventosService>();
        return services;
    }
}
