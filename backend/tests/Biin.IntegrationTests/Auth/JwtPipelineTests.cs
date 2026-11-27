using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Biin.Application.Interfaces;
using Biin.Domain.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Biin.IntegrationTests.Auth;

public class JwtPipelineTests : IClassFixture<JwtPipelineTests.ApiPruebasFactory>
{
    private const string ClaveJwt = "clave-integracion-biin-con-al-menos-32-caracteres";
    private readonly ApiPruebasFactory _factory;

    public JwtPipelineTests(ApiPruebasFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Endpoint_protegido_sin_token_devuelve_401_ProblemDetails()
    {
        using var client = _factory.CreateClient();

        var respuesta = await client.GetAsync("/api/auth/yo");

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
        Assert.Equal("application/problem+json", respuesta.Content.Headers.ContentType?.MediaType);
        var problem = await respuesta.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(401, problem.Status);
        Assert.Equal("No autenticado", problem.Title);
        Assert.Contains("iniciar sesión", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Endpoint_protegido_con_token_invalido_devuelve_401_ProblemDetails()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "token.invalido.firma");

        var respuesta = await client.GetAsync("/api/auth/yo");

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
        var problem = await respuesta.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal("El token de acceso no es válido.", problem.Detail);
    }

    [Fact]
    public async Task Endpoint_protegido_con_token_expirado_devuelve_401_ProblemDetails()
    {
        using var client = _factory.CreateClient();
        var tokenExpirado = CrearToken("1", "jti-expirado", DateTime.UtcNow.AddMinutes(-5));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenExpirado);

        var respuesta = await client.GetAsync("/api/auth/yo");

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
        var problem = await respuesta.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("expiró", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Endpoint_protegido_con_token_revocado_devuelve_401_antes_de_consultar_bd()
    {
        using var client = _factory.CreateClient();
        var jti = Guid.NewGuid().ToString();
        var expira = DateTime.UtcNow.AddMinutes(30);
        var token = CrearToken("1", jti, expira);

        var revocacion = _factory.Services.GetRequiredService<IRevocacionToken>();
        revocacion.Revocar(jti, expira);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var respuesta = await client.GetAsync("/api/auth/yo");

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
        var problem = await respuesta.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("cerrada", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Endpoint_protegido_con_sesion_global_revocada_por_usuario_devuelve_401()
    {
        using var client = _factory.CreateClient();
        var emitido = DateTime.UtcNow.AddMinutes(-3);
        var expira = DateTime.UtcNow.AddMinutes(30);
        var token = CrearToken("77", Guid.NewGuid().ToString(), expira, emitido);

        var revocacion = _factory.Services.GetRequiredService<IRevocacionToken>();
        revocacion.RevocarSesionesUsuario(77, DateTime.UtcNow.AddMinutes(-1), TimeSpan.FromHours(2));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var respuesta = await client.GetAsync("/api/auth/yo");

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
        var problem = await respuesta.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("cerrada", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_superando_limite_devuelve_429_ProblemDetails()
    {
        // Fábrica aislada con límite bajo para probar 429 sin afectar otras pruebas
        using var factoryLimite = ApiPruebasFactory.ConLimite(2);
        using var client = factoryLimite.CreateClient();
        var payloadInvalido = new { correo = "no-es-correo", contrasena = "" };

        var r1 = await client.PostAsJsonAsync("/api/auth/login", payloadInvalido);
        var r2 = await client.PostAsJsonAsync("/api/auth/login", payloadInvalido);
        var r3 = await client.PostAsJsonAsync("/api/auth/login", payloadInvalido);

        Assert.Equal(HttpStatusCode.BadRequest, r1.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, r2.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, r3.StatusCode);
        Assert.Equal("application/problem+json", r3.Content.Headers.ContentType?.MediaType);
        Assert.True(r3.Headers.Contains("Retry-After"));

        var problem = await r3.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(429, problem.Status);
        Assert.Equal("Demasiadas solicitudes", problem.Title);
    }

    private static string CrearToken(string sub, string jti, DateTime expiraUtc, DateTime? emitidoUtc = null)
    {
        var notBefore = expiraUtc < DateTime.UtcNow ? expiraUtc.AddMinutes(-10) : DateTime.UtcNow.AddMinutes(-5);
        var iat = new DateTimeOffset(emitidoUtc ?? DateTime.UtcNow).ToUnixTimeSeconds();
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, sub),
            new Claim(JwtRegisteredClaimNames.Email, "prueba@biin.test"),
            new Claim(JwtRegisteredClaimNames.Name, "Prueba"),
            new Claim(JwtRegisteredClaimNames.Jti, jti),
            new Claim(JwtRegisteredClaimNames.Iat, iat.ToString(), ClaimValueTypes.Integer64),
            new Claim(ClaimTypes.Role, Roles.Viajero)
        };

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ClaveJwt)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "biin-api",
            audience: "biin-web",
            claims: claims,
            notBefore: notBefore,
            expires: expiraUtc,
            signingCredentials: credenciales);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public class ApiPruebasFactory : WebApplicationFactory<Program>
    {
        private readonly int _limiteAuth;

        public ApiPruebasFactory() : this(limiteAuth: 100) { }

        private ApiPruebasFactory(int limiteAuth)
        {
            _limiteAuth = limiteAuth;
        }

        public static ApiPruebasFactory ConLimite(int limiteAuth) => new(limiteAuth);

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Biin", "Host=localhost;Database=biin_test;Username=biin_app;Password=test");
            builder.UseSetting("Jwt:Clave", ClaveJwt);
            builder.UseSetting("Jwt:Emisor", "biin-api");
            builder.UseSetting("Jwt:Audiencia", "biin-web");
            builder.UseSetting("RateLimiting:Autenticacion:LimitePeticiones", _limiteAuth.ToString());
            builder.UseSetting("RateLimiting:Autenticacion:VentanaSegundos", "60");
        }
    }
}
