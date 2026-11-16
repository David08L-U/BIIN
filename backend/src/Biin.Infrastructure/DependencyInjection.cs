using Biin.Application.Interfaces;
using Biin.Infrastructure.Persistence;
using Biin.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Biin.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var cadena = config.GetConnectionString("Biin")
            ?? throw new InvalidOperationException(
                "Falta ConnectionStrings:Biin. Copia appsettings.Development.example.json a appsettings.Development.json.");

        services.AddDbContext<BiinDbContext>(o => o
            .UseNpgsql(cadena)
            .UseSnakeCaseNamingConvention());
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<BiinDbContext>());

        services.Configure<JwtOptions>(config.GetSection(JwtOptions.Seccion));
        services.AddSingleton<IHashContrasena, BcryptHashContrasena>();
        services.AddSingleton<IGeneradorToken, JwtGeneradorToken>();

        return services;
    }
}
