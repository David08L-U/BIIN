using Microsoft.Net.Http.Headers;

namespace Biin.Api.Middleware;

/// <summary>
/// Evita que navegadores, proxies o el Service Worker de la PWA almacenen en caché
/// respuestas de autenticación, perfil, administración o cualquier petición con credenciales (RNF04).
/// </summary>
public class HeadersSeguridadCacheMiddleware(RequestDelegate next)
{
    private static readonly PathString[] PrefijosSensibles =
    [
        new("/api/auth"),
        new("/api/usuarios"),
        new("/api/admin"),
        new("/api/itinerarios"),
        new("/api/favoritos"),
        new("/api/operador")
    ];

    public Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            if (EsRespuestaSensible(context))
            {
                context.Response.Headers[HeaderNames.CacheControl] = "no-store, no-cache";
                context.Response.Headers[HeaderNames.Pragma] = "no-cache";
                context.Response.Headers[HeaderNames.Expires] = "0";
            }

            return Task.CompletedTask;
        });

        return next(context);
    }

    private static bool EsRespuestaSensible(HttpContext context)
    {
        if (context.Request.Headers.ContainsKey(HeaderNames.Authorization))
            return true;

        if (context.User.Identity?.IsAuthenticated == true)
            return true;

        var ruta = context.Request.Path;
        foreach (var prefijo in PrefijosSensibles)
        {
            if (ruta.StartsWithSegments(prefijo, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
