namespace Biin.Domain.Entities;

/// <summary>Registro de cambios hechos desde la administración (paquete 17.1.5).</summary>
public class BitacoraAdmin
{
    public long IdBitacora { get; set; }
    public int IdUsuario { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string Tabla { get; set; } = string.Empty;
    public string IdRegistro { get; set; } = string.Empty;
    public string? Detalle { get; set; }
    public DateTime Fecha { get; set; }

    public Usuario Usuario { get; set; } = null!;
}
