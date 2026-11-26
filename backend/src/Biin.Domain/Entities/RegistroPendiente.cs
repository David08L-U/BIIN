namespace Biin.Domain.Entities;

/// <summary>
/// Registro de un viajero que todavía no confirma su correo (RF01, CU-01).
/// La cuenta en <see cref="Usuario"/> se crea solo cuando escribe el código que le llegó.
/// </summary>
public class RegistroPendiente
{
    public int IdRegistro { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string HashContrasena { get; set; } = string.Empty;
    public string HashCodigo { get; set; } = string.Empty;
    public short Intentos { get; set; }
    public DateTime EnviadoEn { get; set; }
    public DateTime ExpiraEn { get; set; }

    public bool Vencido(DateTime ahoraUtc) => ExpiraEn <= ahoraUtc;
}
