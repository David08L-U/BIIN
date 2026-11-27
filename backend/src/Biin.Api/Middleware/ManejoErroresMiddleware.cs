using Biin.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
            // EF Core envuelve PostgresException dentro de DbUpdateException al guardar cambios
            var excepcionRaiz = ex is DbUpdateException { InnerException: PostgresException pgInner }
                ? pgInner
                : ex;

            var (estado, titulo) = excepcionRaiz switch
            {
                ReglaNegocioException => (StatusCodes.Status400BadRequest, "Regla de negocio"),
                NoAutenticadoException or UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "No autenticado"),
                AccesoDenegadoException => (StatusCodes.Status403Forbidden, "Acceso denegado"),
                NoEncontradoException => (StatusCodes.Status404NotFound, "No encontrado"),
                ConflictoException => (StatusCodes.Status409Conflict, "Conflicto"),
                ServicioNoDisponibleException => (StatusCodes.Status503ServiceUnavailable, "Servicio no disponible"),
                // Violaciones de CHECK, UNIQUE, FK o triggers de la base de datos
                PostgresException { SqlState: PostgresErrorCodes.CheckViolation } =>
                    (StatusCodes.Status400BadRequest, "Dato inválido"),
                PostgresException { SqlState: PostgresErrorCodes.ForeignKeyViolation } =>
                    (StatusCodes.Status400BadRequest, "Referencia inválida"),
                PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } =>
                    (StatusCodes.Status409Conflict, "Registro duplicado"),
                PostgresException { SqlState: PostgresErrorCodes.ExclusionViolation } =>
                    (StatusCodes.Status409Conflict, "Conflicto de vigencia"),
                _ => (StatusCodes.Status500InternalServerError, "Error interno")
            };

            if (estado == StatusCodes.Status500InternalServerError)
                logger.LogError(ex, "Error no controlado en {Ruta}", context.Request.Path);

            var detalle = estado == StatusCodes.Status500InternalServerError
                ? "Ocurrió un error inesperado."
                : excepcionRaiz is PostgresException pg ? pg.MessageText : excepcionRaiz.Message;

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
