using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Biin.IntegrationTests.BaseDatos;

/// <summary>Levanta la API completa conectada al PostgreSQL de BIIN_PRUEBAS_BD.</summary>
public class BdRealFactory : WebApplicationFactory<Program>
{
    public const string ClaveJwt = "clave-pruebas-bd-real-biin-con-al-menos-32-caracteres";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:Biin", BdPruebas.Cadena ?? "Host=localhost;Database=sin_configurar");
        builder.UseSetting("Jwt:Clave", ClaveJwt);
        builder.UseSetting("Jwt:Emisor", "biin-api");
        builder.UseSetting("Jwt:Audiencia", "biin-web");
        builder.UseSetting("RateLimiting:Autenticacion:LimitePeticiones", "1000");
    }

    public override async ValueTask DisposeAsync()
    {
        await BdPruebas.LimpiarUsuariosDePruebaAsync();
        await base.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
