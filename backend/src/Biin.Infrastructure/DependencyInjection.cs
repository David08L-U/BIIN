using Biin.Application.Interfaces;
using Biin.Application.Services;
using Biin.Infrastructure.ExternalServices.Correo;
using Biin.Infrastructure.Persistence;
using Biin.Infrastructure.Security;
using Biin.Infrastructure.Tiempo;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using DnsClient;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

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
        services.AddMemoryCache();
        services.AddSingleton<IHashContrasena, BcryptHashContrasena>();
        services.AddSingleton<IGeneradorToken, JwtGeneradorToken>();
        services.AddSingleton<IRevocacionToken, MemoriaRevocacionToken>();
        services.AddSingleton<IReloj, RelojSistema>();
        services.AddCorreo(config);

        return services;
    }

    /// <summary>
    /// Envío del código de confirmación (RF01): SMTP si Correo:Servidor está configurado;
    /// si no, en Development se escribe en el log y en otro ambiente falla con un mensaje claro.
    /// </summary>
    private static IServiceCollection AddCorreo(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<CorreoOptions>(config.GetSection(CorreoOptions.Seccion));
        services.Configure<VerificacionCorreoOptions>(config.GetSection(VerificacionCorreoOptions.Seccion));

        services.AddSingleton<IEnvioCorreo>(sp =>
        {
            var correo = sp.GetRequiredService<IOptions<CorreoOptions>>();
            if (correo.Value.Configurado)
                return ActivatorUtilities.CreateInstance<SmtpEnvioCorreo>(sp);
            return sp.GetRequiredService<IHostEnvironment>().IsDevelopment()
                ? ActivatorUtilities.CreateInstance<RegistroEnvioCorreo>(sp)
                : new SinConfigurarEnvioCorreo();
        });

        services.AddSingleton<ILookupClient>(_ => new LookupClient(new LookupClientOptions
        {
            Timeout = TimeSpan.FromSeconds(3),
            Retries = 1,
            UseCache = true
        }));
        services.AddSingleton<IValidadorDominioCorreo, DnsValidadorDominioCorreo>();

        return services;
    }
}
