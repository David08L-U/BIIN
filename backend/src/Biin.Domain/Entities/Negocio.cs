namespace Biin.Domain.Entities;

public class Negocio
{
    public int IdRecurso { get; set; }
    public int IdUbicacion { get; set; }
    public string? Telefono { get; set; }
    public decimal? PrecioMinimoAprox { get; set; }
    public decimal? PrecioMaximoAprox { get; set; }

    public Recurso Recurso { get; set; } = null!;
    public Ubicacion Ubicacion { get; set; } = null!;
}
