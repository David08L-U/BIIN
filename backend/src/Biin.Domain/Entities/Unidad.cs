namespace Biin.Domain.Entities;

public class Unidad
{
    public int IdUnidad { get; set; }
    public string Identificador { get; set; } = string.Empty;
    public int Capacidad { get; set; }
    public bool Activa { get; set; } = true;
}
