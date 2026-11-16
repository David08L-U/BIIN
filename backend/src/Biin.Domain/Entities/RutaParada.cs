namespace Biin.Domain.Entities;

public class RutaParada
{
    public int IdRuta { get; set; }
    public int Orden { get; set; }
    public int IdUbicacion { get; set; }
    public bool PermiteAbordar { get; set; } = true;
    public bool PermiteDescender { get; set; } = true;

    public Ruta Ruta { get; set; } = null!;
    public Ubicacion Ubicacion { get; set; } = null!;
}
