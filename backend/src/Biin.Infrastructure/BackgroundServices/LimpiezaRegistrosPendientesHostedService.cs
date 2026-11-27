using Biin.Application.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Biin.Infrastructure.BackgroundServices;

/// <summary>
/// Proceso en segundo plano que limpia periódicamente los registros pendientes expirados
/// para no acumular correos sin confirmar en PostgreSQL (RF01, RNF04).
/// </summary>
public class LimpiezaRegistrosPendientesHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<VerificacionCorreoOptions> opciones,
    ILogger<LimpiezaRegistrosPendientesHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var minutos = opciones.Value.IntervaloLimpiezaMinutos;
        if (minutos <= 0)
            return;

        using var temporizador = new PeriodicTimer(TimeSpan.FromMinutes(minutos));

        try
        {
            while (await temporizador.WaitForNextTickAsync(stoppingToken))
                await EjecutarCicloAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Apagado normal de la aplicación
        }
    }

    internal async Task<int> EjecutarCicloAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var servicio = scope.ServiceProvider.GetRequiredService<LimpiezaRegistrosPendientesService>();
            var eliminados = await servicio.LimpiarVencidosAsync(ct);
            if (eliminados > 0)
                logger.LogInformation("Limpieza automática: se eliminaron {Cantidad} registros pendientes expirados.", eliminados);
            return eliminados;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No se pudo completar el ciclo de limpieza de registros pendientes expirados.");
            return 0;
        }
    }
}
