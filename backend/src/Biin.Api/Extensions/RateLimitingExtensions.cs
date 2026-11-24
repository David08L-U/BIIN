using System.Threading.RateLimiting;
using Biin.Api.Configuration;
using Microsoft.AspNetCore.Mvc;

namespace Biin.Api.Extensions;

public static class RateLimitingExtensions
{
    public static IServiceCollection AddRateLimitingBiin(this IServiceCollection services, IConfiguration config)
    {
        var limite = Math.Max(1, config.GetValue("RateLimiting:Autenticacion:LimitePeticiones", 10));
        var ventanaSegundos = Math.Max(1, config.GetValue("RateLimiting:Autenticacion:VentanaSegundos", 60));

        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            o.AddPolicy(PoliticasRateLimit.Autenticacion, httpContext =>
            {
                var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "desconocido";
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ip,
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = limite,
                        Window = TimeSpan.FromSeconds(ventanaSegundos),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0,
                        AutoReplenishment = true
                    });
            });

            o.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        Math.Ceiling(retryAfter.TotalSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture);
                }

                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = "Demasiadas solicitudes",
                    Detail = "Has superado el límite de intentos permitidos. Intenta nuevamente en unos momentos.",
                    Instance = context.HttpContext.Request.Path
                }, options: null, contentType: "application/problem+json", cancellationToken: cancellationToken);
            };
        });

        return services;
    }
}
