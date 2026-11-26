using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Biin.Api.Extensions;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.Infrastructure.Security;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Biin.IntegrationTests.Security;

public class SeguridadBaseTests
{
    private const string ClavePrueba = "clave-de-prueba-para-biin-con-mas-de-32-caracteres";

    [Fact]
    public void Bcrypt_genera_hash_valido_y_verifica_contrasenas()
    {
        var hasher = new BcryptHashContrasena();

        var hash = hasher.Generar("Secreto123!");

        Assert.NotEqual("Secreto123!", hash);
        Assert.True(hasher.Verificar("Secreto123!", hash));
        Assert.False(hasher.Verificar("OtraContrasena", hash));
    }

    [Fact]
    public void Bcrypt_verifica_hash_formato_2a_compatible_con_pgcrypto()
    {
        var hasher = new BcryptHashContrasena();
        // pgcrypto gen_salt('bf', 11) produce prefijo $2a$11$
        var hash2a = BCrypt.Net.BCrypt.HashPassword("ClaveAdmin123", BCrypt.Net.BCrypt.GenerateSalt(11, 'a'));

        Assert.StartsWith("$2a$11$", hash2a);
        Assert.True(hasher.Verificar("ClaveAdmin123", hash2a));
        Assert.False(hasher.Verificar("Incorrecta", hash2a));
    }

    [Fact]
    public void JwtGeneradorToken_incluye_claims_y_multiples_roles()
    {
        var generador = new JwtGeneradorToken(Options.Create(new JwtOptions
        {
            Emisor = "biin-api",
            Audiencia = "biin-web",
            Clave = ClavePrueba,
            MinutosExpiracion = 60
        }));

        var usuario = new Usuario
        {
            IdUsuario = 42,
            Nombre = "Operador Demo",
            Correo = "operador@biin.test"
        };

        var (token, expira) = generador.Generar(usuario, [Roles.Viajero, Roles.Operador]);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        Assert.Equal("biin-api", jwt.Issuer);
        Assert.Contains("biin-web", jwt.Audiences);
        Assert.Equal("42", jwt.Subject);
        Assert.Equal("operador@biin.test", jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.Equal("Operador Demo", jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Name).Value);
        Assert.False(string.IsNullOrWhiteSpace(jwt.Id));
        Assert.True(expira > DateTime.UtcNow.AddMinutes(55));

        var roles = jwt.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();
        Assert.Contains(Roles.Viajero, roles);
        Assert.Contains(Roles.Operador, roles);
    }

    [Fact]
    public void MemoriaRevocacionToken_revoca_y_consulta_jti()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var revocacion = new MemoriaRevocacionToken(cache);
        var jti = Guid.NewGuid().ToString();

        Assert.False(revocacion.EstaRevocado(jti));

        revocacion.Revocar(jti, DateTime.UtcNow.AddMinutes(10));

        Assert.True(revocacion.EstaRevocado(jti));
        Assert.False(revocacion.EstaRevocado("otro-jti"));
        Assert.False(revocacion.EstaRevocado(""));
    }

    [Fact]
    public void MemoriaRevocacionToken_no_almacena_tokens_ya_expirados()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var revocacion = new MemoriaRevocacionToken(cache);
        var jti = Guid.NewGuid().ToString();

        revocacion.Revocar(jti, DateTime.UtcNow.AddMinutes(-5));

        Assert.False(revocacion.EstaRevocado(jti));
    }

    [Fact]
    public void ClaimsPrincipal_helpers_extraen_datos_y_lanzan_NoAutenticado_sin_sub()
    {
        var exp = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();
        var identity = new ClaimsIdentity(
        [
            new Claim(JwtRegisteredClaimNames.Sub, "7"),
            new Claim(JwtRegisteredClaimNames.Jti, "abc-123"),
            new Claim(JwtRegisteredClaimNames.Exp, exp.ToString()),
            new Claim(ClaimTypes.Role, Roles.Viajero),
            new Claim(ClaimTypes.Role, Roles.Administrador)
        ], "Bearer", JwtRegisteredClaimNames.Name, ClaimTypes.Role);
        var principal = new ClaimsPrincipal(identity);

        Assert.Equal(7, principal.IdUsuario());
        Assert.Equal("abc-123", principal.Jti());
        Assert.Equal(DateTimeOffset.FromUnixTimeSeconds(exp).UtcDateTime, principal.ExpiraEnUtc());
        Assert.True(principal.TieneRol(Roles.Viajero));
        Assert.True(principal.EsAdministrador());
        Assert.Equal(2, principal.RolesUsuario().Count);

        var sinSub = new ClaimsPrincipal(new ClaimsIdentity());
        Assert.Throws<NoAutenticadoException>(() => sinSub.IdUsuario());
    }

    [Fact]
    public void DistribuidaRevocacionToken_revoca_por_jti_y_globalmente_por_usuario()
    {
        var cache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
        var revocacion = new DistribuidaRevocacionToken(cache);
        var jti = Guid.NewGuid().ToString();
        var ahora = DateTime.UtcNow;

        Assert.False(revocacion.EstaRevocado(jti));
        revocacion.Revocar(jti, ahora.AddMinutes(10));
        Assert.True(revocacion.EstaRevocado(jti));

        // Un token ya vencido no se almacena
        var jtiViejo = Guid.NewGuid().ToString();
        revocacion.Revocar(jtiViejo, ahora.AddMinutes(-5));
        Assert.False(revocacion.EstaRevocado(jtiViejo));

        // Revocación global por usuario invalida tokens emitidos hasta el corte, pero permite tokens posteriores
        Assert.False(revocacion.SesionUsuarioRevocada(7, ahora.AddMinutes(-2)));
        revocacion.RevocarSesionesUsuario(7, ahora, TimeSpan.FromHours(2));
        Assert.True(revocacion.SesionUsuarioRevocada(7, ahora.AddMinutes(-2)));
        Assert.True(revocacion.SesionUsuarioRevocada(7, ahora));
        Assert.False(revocacion.SesionUsuarioRevocada(7, ahora.AddSeconds(5)));
        Assert.False(revocacion.SesionUsuarioRevocada(8, ahora.AddMinutes(-2)));
    }
}
