namespace Biin.Domain.Entities;

public class OperadorRuta
{
    public int IdUsuario { get; set; }
    public int IdRuta { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public Ruta Ruta { get; set; } = null!;
}
