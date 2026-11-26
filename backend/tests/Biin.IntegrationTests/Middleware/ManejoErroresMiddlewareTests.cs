using System.Text.Json;
using Biin.Api.Middleware;
using Biin.Domain.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;

namespace Biin.IntegrationTests.Middleware;

public class ManejoErroresMiddlewareTests
{
    [Theory]
    [InlineData(typeof(ReglaNegocioException), StatusCodes.Status400BadRequest, "Regla de negocio")]
    [InlineData(typeof(NoAutenticadoException), StatusCodes.Status401Unauthorized, "No autenticado")]
    [InlineData(typeof(UnauthorizedAccessException), StatusCodes.Status401Unauthorized, "No autenticado")]
    [InlineData(typeof(AccesoDenegadoException), StatusCodes.Status403Forbidden, "Acceso denegado")]
    [InlineData(typeof(NoEncontradoException), StatusCodes.Status404NotFound, "No encontrado")]
    [InlineData(typeof(ConflictoException), StatusCodes.Status409Conflict, "Conflicto")]
    [InlineData(typeof(ServicioNoDisponibleException), StatusCodes.Status503ServiceUnavailable, "Servicio no disponible")]
    public async Task Mapea_excepciones_de_dominio_al_codigo_http_correcto(Type tipoExcepcion, int estadoEsperado, string tituloEsperado)
    {
        var excepcion = (Exception)Activator.CreateInstance(tipoExcepcion, "Detalle de prueba")!;
        var (estado, problem) = await EjecutarMiddlewareAsync(excepcion);

        Assert.Equal(estadoEsperado, estado);
        Assert.Equal(estadoEsperado, problem.Status);
        Assert.Equal(tituloEsperado, problem.Title);
        Assert.Equal("Detalle de prueba", problem.Detail);
    }

    [Theory]
    [InlineData(PostgresErrorCodes.UniqueViolation, StatusCodes.Status409Conflict, "Registro duplicado")]
    [InlineData(PostgresErrorCodes.CheckViolation, StatusCodes.Status400BadRequest, "Dato inválido")]
    [InlineData(PostgresErrorCodes.ForeignKeyViolation, StatusCodes.Status400BadRequest, "Referencia inválida")]
    public async Task Desempaqueta_DbUpdateException_con_PostgresException(string sqlState, int estadoEsperado, string tituloEsperado)
    {
        var pg = new PostgresException("Violación de restricción", "ERROR", "ERROR", sqlState);
        var dbEx = new DbUpdateException("Error al guardar", pg);

        var (estado, problem) = await EjecutarMiddlewareAsync(dbEx);

        Assert.Equal(estadoEsperado, estado);
        Assert.Equal(tituloEsperado, problem.Title);
        Assert.Equal("Violación de restricción", problem.Detail);
    }

    [Fact]
    public async Task Error_no_controlado_devuelve_500_sin_exponer_detalle_interno()
    {
        var (estado, problem) = await EjecutarMiddlewareAsync(new InvalidOperationException("secreto interno"));

        Assert.Equal(StatusCodes.Status500InternalServerError, estado);
        Assert.Equal("Error interno", problem.Title);
        Assert.Equal("Ocurrió un error inesperado.", problem.Detail);
    }

    private static async Task<(int Estado, ProblemDetails Problem)> EjecutarMiddlewareAsync(Exception excepcion)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/prueba";
        context.Response.Body = new MemoryStream();

        var middleware = new ManejoErroresMiddleware(
            _ => throw excepcion,
            NullLogger<ManejoErroresMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var problem = await JsonSerializer.DeserializeAsync<ProblemDetails>(
            context.Response.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(problem);
        return (context.Response.StatusCode, problem);
    }
}
