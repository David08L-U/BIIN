namespace Biin.Application.Interfaces;

/// <summary>Acciones permitidas por el CHECK de la tabla <c>bitacora_admin</c>.</summary>
public static class AccionesBitacora
{
    public const string Crear = "crear";
    public const string Editar = "editar";
    public const string Publicar = "publicar";
    public const string Archivar = "archivar";
    public const string Eliminar = "eliminar";
}

/// <summary>Registra cambios administrativos en <c>bitacora_admin</c> (paquete 17.1.5, CU-12).</summary>
public interface IBitacoraAdmin
{
    /// <summary>
    /// Agrega una entrada a la bitácora en el contexto actual; se persiste junto con el <c>SaveChangesAsync</c> del servicio.
    /// Nunca pasar contraseñas, hashes ni tokens en <paramref name="detalle"/>.
    /// </summary>
    void Registrar(int idUsuarioAdmin, string accion, string tabla, string idRegistro, object? detalle = null);
}
