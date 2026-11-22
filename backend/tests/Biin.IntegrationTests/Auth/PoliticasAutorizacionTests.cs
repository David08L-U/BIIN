using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using Biin.Api.Configuration;
using Biin.Api.Extensions;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Biin.IntegrationTests.Auth;

/// <summary>
/// Controlador solo de pruebas para validar las políticas de autorización reales de BIIN sobre HTTP (RNF04).
/// </summary>
[ApiController]
[Route("api/_pruebas-autorizacion")]
public class PruebasAutorizacionController(IAuthorizationService autorizacion) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("publico")]
    public IActionResult Publico() => Ok(new { acceso = "publico" });

    [Authorize(Policy = PoliticasAutorizacion.RequiereViajero)]
    [HttpGet("viajero")]
    public IActionResult Viajero() => Ok(new { acceso = Roles.Viajero });

    [Authorize(Policy = PoliticasAutorizacion.RequiereOperador)]
    [HttpGet("operador")]
    public IActionResult Operador() => Ok(new { acceso = Roles.Operador });

    [Authorize(Policy = PoliticasAutorizacion.RequiereAdministrador)]
    [HttpGet("admin")]
    public IActionResult Admin() => Ok(new { acceso = Roles.Administrador });

    [Authorize(Policy = PoliticasAutorizacion.RequiereOperadorOAdministrador)]
    [HttpGet("operador-o-admin")]
    public IActionResult OperadorOAdmin() => Ok(new { acceso = "operador_o_admin" });

    [Authorize(Policy = PoliticasAutorizacion.RequiereColaboradorOAdministrador)]
    [HttpGet("colaborador-o-admin")]
    public IActionResult ColaboradorOAdmin() => Ok(new { acceso = "colaborador_o_admin" });

    [Authorize(Policy = PoliticasAutorizacion.RequiereOperador)]
    [HttpGet("rutas/{idRuta:int}/cupo")]
    public async Task<IActionResult> OperarRuta(int idRuta)
    {
        await autorizacion.AsegurarOperadorDeRutaAsync(User, idRuta);
        return Ok(new { idRuta, autorizado = true });
    }
}

public class PoliticasAutorizacionTests : IClassFixture<PoliticasAutorizacionTests.AutorizacionFactory>
{
    private const string ClaveJwt = "clave-politicas-biin-con-al-menos-32-caracteres-seguros";
    private readonly AutorizacionFactory _factory;
    private readonly JwtGeneradorToken _generador;

    public PoliticasAutorizacionTests(AutorizacionFactory factory)
    {
        _factory = factory;
        _generador = new JwtGeneradorToken(Options.Create(new JwtOptions
        {
            Emisor = "biin-api",
            Audiencia = "biin-web",
            Clave = ClaveJwt,
            MinutosExpiracion = 30
        }));
    }

    [Fact]
    public async Task Endpoint_publico_funciona_sin_token()
    {
        using var client = _factory.CreateClient();

        var respuesta = await client.GetAsync("/api/_pruebas-autorizacion/publico");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
    }

    [Theory]
    [InlineData("/api/_pruebas-autorizacion/viajero")]
    [InlineData("/api/_pruebas-autorizacion/operador")]
    [InlineData("/api/_pruebas-autorizacion/admin")]
    [InlineData("/api/_pruebas-autorizacion/operador-o-admin")]
    [InlineData("/api/_pruebas-autorizacion/colaborador-o-admin")]
    public async Task Endpoints_protegidos_sin_token_devuelven_401_ProblemDetails(string ruta)
    {
        using var client = _factory.CreateClient();

        var respuesta = await client.GetAsync(ruta);

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
        Assert.Equal("application/problem+json", respuesta.Content.Headers.ContentType?.MediaType);
    }

    [Theory]
    [InlineData("/api/_pruebas-autorizacion/viajero", new[] { Roles.Viajero }, HttpStatusCode.OK)]
    [InlineData("/api/_pruebas-autorizacion/operador", new[] { Roles.Viajero }, HttpStatusCode.Forbidden)]
    [InlineData("/api/_pruebas-autorizacion/admin", new[] { Roles.Viajero }, HttpStatusCode.Forbidden)]
    [InlineData("/api/_pruebas-autorizacion/operador-o-admin", new[] { Roles.Viajero }, HttpStatusCode.Forbidden)]
    [InlineData("/api/_pruebas-autorizacion/colaborador-o-admin", new[] { Roles.Viajero }, HttpStatusCode.Forbidden)]
    [InlineData("/api/_pruebas-autorizacion/operador", new[] { Roles.Viajero, Roles.Operador }, HttpStatusCode.OK)]
    [InlineData("/api/_pruebas-autorizacion/operador-o-admin", new[] { Roles.Viajero, Roles.Operador }, HttpStatusCode.OK)]
    [InlineData("/api/_pruebas-autorizacion/admin", new[] { Roles.Viajero, Roles.Operador }, HttpStatusCode.Forbidden)]
    [InlineData("/api/_pruebas-autorizacion/colaborador-o-admin", new[] { Roles.Viajero, Roles.Colaborador }, HttpStatusCode.OK)]
    [InlineData("/api/_pruebas-autorizacion/admin", new[] { Roles.Viajero, Roles.Administrador }, HttpStatusCode.OK)]
    [InlineData("/api/_pruebas-autorizacion/operador-o-admin", new[] { Roles.Viajero, Roles.Administrador }, HttpStatusCode.OK)]
    [InlineData("/api/_pruebas-autorizacion/colaborador-o-admin", new[] { Roles.Viajero, Roles.Administrador }, HttpStatusCode.OK)]
    [InlineData("/api/_pruebas-autorizacion/operador", new[] { Roles.Viajero, Roles.Administrador }, HttpStatusCode.Forbidden)]
    public async Task Matriz_de_politicas_respeta_roles_simples_y_multiples(
        string ruta,
        string[] roles,
        HttpStatusCode estadoEsperado)
    {
        using var client = CrearClienteConRoles(idUsuario: 10, roles);

        var respuesta = await client.GetAsync(ruta);

        Assert.Equal(estadoEsperado, respuesta.StatusCode);

        if (estadoEsperado == HttpStatusCode.Forbidden)
        {
            Assert.Equal("application/problem+json", respuesta.Content.Headers.ContentType?.MediaType);
            var problem = await respuesta.Content.ReadFromJsonAsync<ProblemDetails>();
            Assert.NotNull(problem);
            Assert.Equal(403, problem.Status);
            Assert.Equal("Acceso denegado", problem.Title);
            Assert.Contains("permisos", problem.Detail, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public async Task Operador_autorizado_en_ruta_recibe_200_y_en_ruta_ajena_recibe_403()
    {
        using var client = CrearClienteConRoles(idUsuario: 50, Roles.Viajero, Roles.Operador);

        var permitida = await client.GetAsync("/api/_pruebas-autorizacion/rutas/101/cupo");
        var denegada = await client.GetAsync("/api/_pruebas-autorizacion/rutas/999/cupo");

        Assert.Equal(HttpStatusCode.OK, permitida.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, denegada.StatusCode);

        var problem = await denegada.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(403, problem.Status);
        Assert.Equal("Acceso denegado", problem.Title);
        Assert.Contains("operar esta ruta", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AsegurarOperadorDeRutaAsync_lanza_AccesoDenegado_sin_rol_operador_o_ruta_invalida()
    {
        using var scope = _factory.Services.CreateScope();
        var authService = scope.ServiceProvider.GetRequiredService<IAuthorizationService>();

        var viajero = CrearPrincipal(idUsuario: 50, Roles.Viajero);
        var operadorSinSub = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.Role, Roles.Operador)],
            "Bearer",
            JwtRegisteredClaimNames.Name,
            ClaimTypes.Role));
        var operadorAutorizado = CrearPrincipal(idUsuario: 50, Roles.Viajero, Roles.Operador);

        await Assert.ThrowsAsync<AccesoDenegadoException>(() =>
            authService.AsegurarOperadorDeRutaAsync(viajero, 101));
        await Assert.ThrowsAsync<AccesoDenegadoException>(() =>
            authService.AsegurarOperadorDeRutaAsync(operadorSinSub, 101));
        await Assert.ThrowsAsync<AccesoDenegadoException>(() =>
            authService.AsegurarOperadorDeRutaAsync(operadorAutorizado, 0));

        // Ruta autorizada para el operador 50 no debe lanzar excepción
        await authService.AsegurarOperadorDeRutaAsync(operadorAutorizado, 101);
    }

    private HttpClient CrearClienteConRoles(int idUsuario, params string[] roles)
    {
        var usuario = new Usuario
        {
            IdUsuario = idUsuario,
            Nombre = "Usuario Prueba",
            Correo = $"u{idUsuario}@biin.test"
        };
        var (token, _) = _generador.Generar(usuario, roles);

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static ClaimsPrincipal CrearPrincipal(int idUsuario, params string[] roles)
    {
        var claims = new List<Claim> { new(JwtRegisteredClaimNames.Sub, idUsuario.ToString()) };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer", JwtRegisteredClaimNames.Name, ClaimTypes.Role));
    }

    public class AutorizacionFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Biin", "Host=localhost;Database=biin_test;Username=biin_app;Password=test");
            builder.UseSetting("Jwt:Clave", ClaveJwt);
            builder.UseSetting("Jwt:Emisor", "biin-api");
            builder.UseSetting("Jwt:Audiencia", "biin-web");

            builder.ConfigureServices(services =>
            {
                // Expone únicamente el controlador de pruebas para validar el pipeline real de autorización
                services.AddControllers().AddApplicationPart(typeof(PruebasAutorizacionController).Assembly);

                // Doble en memoria de operador_ruta (operador 50 -> ruta 101)
                services.RemoveAll<IAutorizacionOperador>();
                services.AddScoped<IAutorizacionOperador>(_ => new AutorizacionOperadorFalsa((50, 101)));

                // Aísla la prueba de políticas/roles sin requerir conexión activa a PostgreSQL en OnTokenValidated
                services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, o =>
                {
                    o.Events.OnTokenValidated = _ => Task.CompletedTask;
                });
            });
        }
    }

    private sealed class AutorizacionOperadorFalsa(params (int IdUsuario, int IdRuta)[] asignaciones) : IAutorizacionOperador
    {
        private readonly HashSet<(int, int)> _asignaciones = [.. asignaciones];

        public Task<bool> PuedeOperarRutaAsync(int idUsuario, int idRuta, CancellationToken ct = default) =>
            Task.FromResult(_asignaciones.Contains((idUsuario, idRuta)));
    }
}
