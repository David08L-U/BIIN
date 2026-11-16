using Biin.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace Biin.Api.Middleware;

/// <summary>Convierte excepciones en respuestas ProblemDetails con el código HTTP correcto.</summary>
public class ManejoErroresMiddleware(RequestDelegate next, ILogger<ManejoErroresMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var (estado, titulo) = ex switch
            {
                ReglaNegocioException => (StatusCodes.Status400BadRequest, "Regla de negocio"),
                NoAutenticadoException => (StatusCodes.Status401Unauthorized, "No autenticado"),
                AccesoDenegadoException => (StatusCodes.Status403Forbidden, "Acceso denegado"),
                NoEncontradoException => (StatusCodes.Status404NotFound, "No encontrado"),
                ConflictoException => (StatusCodes.Status409Conflict, "Conflicto"),
                // Violaciones de CHECK o triggers de la base de datos
                PostgresException { SqlState: PostgresErrorCodes.CheckViolation } =>
                    (StatusCodes.Status400BadRequest, "Dato inválido"),
                PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } =>
                    (StatusCodes.Status409Conflict, "Registro duplicado"),
                _ => (StatusCodes.Status500InternalServerError, "Error interno")
            };

            if (estado == StatusCodes.Status500InternalServerError)
                logger.LogError(ex, "Error no controlado en {Ruta}", context.Request.Path);

            var detalle = estado == StatusCodes.Status500InternalServerError
                ? "Ocurrió un error inesperado."
                : ex is PostgresException pg ? pg.MessageText : ex.Message;

            context.Response.StatusCode = estado;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = estado,
                Title = titulo,
                Detail = detalle,
                Instance = context.Request.Path
            });
        }
    }
}
