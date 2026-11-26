using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using Biin.Application.DTOs.Auth;
using Biin.Application.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Biin.IntegrationTests.BaseDatos;

/// <summary>Levanta la API completa conectada al PostgreSQL de BIIN_PRUEBAS_BD.</summary>
public class BdRealFactory : WebApplicationFactory<Program>
{
    public const string ClaveJwt = "clave-pruebas-bd-real-biin-con-al-menos-32-caracteres";

    /// <summary>Buzón en memoria: los códigos de confirmación llegan aquí en lugar de mandarse por SMTP.</summary>
    public BuzonPruebas Buzon { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:Biin", BdPruebas.Cadena ?? "Host=localhost;Database=sin_configurar");
        builder.UseSetting("Jwt:Clave", ClaveJwt);
        builder.UseSetting("Jwt:Emisor", "biin-api");
        builder.UseSetting("Jwt:Audiencia", "biin-web");
        builder.UseSetting("RateLimiting:Autenticacion:LimitePeticiones", "1000");
        // Los correos de prueba usan el dominio reservado .test, que no existe en DNS
        builder.UseSetting("VerificacionCorreo:ValidarDominio", "false");

        builder.ConfigureTestServices(s => s.AddSingleton<IEnvioCorreo>(Buzon));
    }

    /// <summary>Registro completo de un viajero: pide el código, lo lee del buzón y lo confirma.</summary>
    public async Task<AuthResponse> RegistrarViajeroAsync(HttpClient client, string nombre, string correo, string contrasena)
    {
        var registro = await client.PostAsJsonAsync("/api/auth/registro", new RegistroRequest(nombre, correo, contrasena));
        Assert.Equal(HttpStatusCode.Accepted, registro.StatusCode);

        var verificar = await client.PostAsJsonAsync("/api/auth/registro/verificar",
            new VerificarRegistroRequest(correo, Buzon.UltimoCodigo(correo)));
        Assert.Equal(HttpStatusCode.Created, verificar.StatusCode);
        return (await verificar.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    public override async ValueTask DisposeAsync()
    {
        await BdPruebas.LimpiarUsuariosDePruebaAsync();
        await base.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}

/// <summary>Guarda el último código enviado a cada correo (sin distinguir mayúsculas).</summary>
public sealed class BuzonPruebas : IEnvioCorreo
{
    private readonly ConcurrentDictionary<string, string> _codigos = new(StringComparer.OrdinalIgnoreCase);

    public int Enviados { get; private set; }

    public string UltimoCodigo(string correo) =>
        _codigos.TryGetValue(correo.Trim(), out var codigo)
            ? codigo
            : throw new InvalidOperationException($"No llegó ningún código a {correo}.");

    public Task EnviarCodigoVerificacionAsync(
        string correo, string nombre, string codigo, DateTime expiraEnUtc, CancellationToken ct = default)
    {
        _codigos[correo] = codigo;
        Enviados++;
        return Task.CompletedTask;
    }
}
