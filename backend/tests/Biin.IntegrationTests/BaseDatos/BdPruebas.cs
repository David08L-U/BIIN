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

    /// <summary>Marca de las ubicaciones y localidades que crean las pruebas, para borrarlas al final.</summary>
    public const string MarcaGeografia = "[PRUEBA]";

    /// <summary>
    /// Borra los usuarios de prueba y lo que cuelga de ellos (itinerarios, roles, favoritos), los contenidos
    /// que crearon como administradores (recursos.id_creador es ON DELETE RESTRICT) y la geografía marcada.
    /// </summary>
    public static async Task LimpiarUsuariosDePruebaAsync()
    {
        if (!Disponible) return;

        await using var conexion = new NpgsqlConnection(Cadena);
        await conexion.OpenAsync();
        await using var cmd = conexion.CreateCommand();
        cmd.CommandText = """
            CREATE TEMP TABLE pruebas_usuarios ON COMMIT DROP AS
                SELECT id_usuario FROM usuarios WHERE correo LIKE '%@' || @dominio;
            CREATE TEMP TABLE pruebas_recursos ON COMMIT DROP AS
                SELECT id_recurso FROM recursos
                WHERE id_creador IN (SELECT id_usuario FROM pruebas_usuarios)
                   OR id_revisor IN (SELECT id_usuario FROM pruebas_usuarios);
            DELETE FROM actividades_itinerario WHERE id_recurso IN (SELECT id_recurso FROM pruebas_recursos);
            DELETE FROM negocios WHERE id_recurso IN (SELECT id_recurso FROM pruebas_recursos);
            DELETE FROM lugares WHERE id_recurso IN (SELECT id_recurso FROM pruebas_recursos);
            DELETE FROM eventos WHERE id_recurso IN (SELECT id_recurso FROM pruebas_recursos);
            DELETE FROM recursos WHERE id_recurso IN (SELECT id_recurso FROM pruebas_recursos);
            DELETE FROM bitacora_admin WHERE id_usuario IN (SELECT id_usuario FROM pruebas_usuarios);
            DELETE FROM usuarios WHERE id_usuario IN (SELECT id_usuario FROM pruebas_usuarios);
            DELETE FROM ubicaciones WHERE direccion_referencia LIKE @marca || '%';
            DELETE FROM localidades l WHERE l.nombre LIKE @marca || '%'
                AND NOT EXISTS (SELECT 1 FROM ubicaciones u WHERE u.id_localidad = l.id_localidad);
            """;
        cmd.Parameters.AddWithValue("dominio", DominioCorreos);
        cmd.Parameters.AddWithValue("marca", MarcaGeografia);
        await using var tx = await conexion.BeginTransactionAsync();
        cmd.Transaction = tx;
        await cmd.ExecuteNonQueryAsync();
        await tx.CommitAsync();
    }

    /// <summary>Crea un administrador de prueba directamente en la base (la API solo registra viajeros).</summary>
    public static async Task<string> CrearAdministradorAsync(string contrasena)
    {
        var correo = CorreoUnico("admin");
        await using var conexion = new NpgsqlConnection(Cadena);
        await conexion.OpenAsync();
        await using var cmd = conexion.CreateCommand();
        cmd.CommandText = """
            WITH nuevo AS (
                INSERT INTO usuarios (nombre, correo, hash_contrasena) VALUES ('Admin de Prueba', @correo, @hash)
                RETURNING id_usuario)
            INSERT INTO usuario_rol (id_usuario, id_rol)
            SELECT nuevo.id_usuario, r.id_rol FROM nuevo, roles r WHERE r.nombre IN ('viajero', 'administrador');
            """;
        cmd.Parameters.AddWithValue("correo", correo);
        cmd.Parameters.AddWithValue("hash", BCrypt.Net.BCrypt.HashPassword(contrasena, 11));
        await cmd.ExecuteNonQueryAsync();
        return correo;
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
