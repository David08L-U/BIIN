namespace Biin.Domain.Entities;

public class Ubicacion
{
    public int IdUbicacion { get; set; }
    public int IdLocalidad { get; set; }
    public string? DireccionReferencia { get; set; }
    public decimal Latitud { get; set; }
    public decimal Longitud { get; set; }

    public Localidad Localidad { get; set; } = null!;
}
