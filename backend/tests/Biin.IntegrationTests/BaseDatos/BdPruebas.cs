using Biin.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Biin.IntegrationTests.BaseDatos;

/// <summary>
/// Conexión a un PostgreSQL real para las pruebas marcadas con <see cref="FactBdAttribute"/>.
/// Se activa con la variable de entorno BIIN_PRUEBAS_BD (cadena de conexión de biin_app a una
/// base creada con database/crear_bd.ps1 -Demo). Sin la variable, esas pruebas se omiten.
/// Las pruebas crean datos con correos *@pruebas.biin.test y los borran al terminar.
/// </summary>
public static class BdPruebas
{
    public const string Variable = "BIIN_PRUEBAS_BD";
    public const string DominioCorreos = "pruebas.biin.test";

    public static string? Cadena => Environment.GetEnvironmentVariable(Variable) is { Length: > 0 } c ? c : null;

    public static bool Disponible => Cadena is not null;

    public static BiinDbContext CrearContexto()
    {
        var opciones = new DbContextOptionsBuilder<BiinDbContext>()
            .UseNpgsql(Cadena ?? throw new InvalidOperationException($"Falta la variable {Variable}."))
            .UseSnakeCaseNamingConvention()
            .Options;
        return new BiinDbContext(opciones);
    }

    /// <summary>Correo único para una prueba; se borra con <see cref="LimpiarUsuariosDePruebaAsync"/>.</summary>
    public static string CorreoUnico(string prefijo) => $"{prefijo}.{Guid.NewGuid():N}@{DominioCorreos}";

    /// <summary>Borra los usuarios de prueba y lo que cuelga de ellos (itinerarios, roles, favoritos).</summary>
    public static async Task LimpiarUsuariosDePruebaAsync()
    {
        if (!Disponible) return;

        await using var conexion = new NpgsqlConnection(Cadena);
        await conexion.OpenAsync();
        await using var cmd = conexion.CreateCommand();
        cmd.CommandText = """
            DELETE FROM bitacora_admin WHERE id_usuario IN (SELECT id_usuario FROM usuarios WHERE correo LIKE '%@' || @dominio);
            DELETE FROM usuarios WHERE correo LIKE '%@' || @dominio;
            """;
        cmd.Parameters.AddWithValue("dominio", DominioCorreos);
        await cmd.ExecuteNonQueryAsync();
    }
}

/// <summary>Prueba que necesita PostgreSQL real; se omite si no está definida BIIN_PRUEBAS_BD.</summary>
public sealed class FactBdAttribute : FactAttribute
{
    public FactBdAttribute()
    {
        if (!BdPruebas.Disponible)
            Skip = $"Define {BdPruebas.Variable} con la cadena de conexión de biin_app para correr esta prueba.";
    }
}

/// <summary>Teoría que necesita PostgreSQL real; se omite si no está definida BIIN_PRUEBAS_BD.</summary>
public sealed class TheoryBdAttribute : TheoryAttribute
{
    public TheoryBdAttribute()
    {
        if (!BdPruebas.Disponible)
            Skip = $"Define {BdPruebas.Variable} con la cadena de conexión de biin_app para correr esta prueba.";
    }
}
