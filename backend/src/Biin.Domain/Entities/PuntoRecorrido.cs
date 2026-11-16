namespace Biin.Domain.Entities;

public class PuntoRecorrido
{
    public int IdRuta { get; set; }
    public int Orden { get; set; }
    public decimal Latitud { get; set; }
    public decimal Longitud { get; set; }

    public Ruta Ruta { get; set; } = null!;
}
