namespace Biin.Domain.Entities;

public class Lugar
{
    public int IdRecurso { get; set; }
    public int IdUbicacion { get; set; }
    public decimal? CostoAcceso { get; set; }
    public string? CondicionesAcceso { get; set; }

    public Recurso Recurso { get; set; } = null!;
    public Ubicacion Ubicacion { get; set; } = null!;
}
