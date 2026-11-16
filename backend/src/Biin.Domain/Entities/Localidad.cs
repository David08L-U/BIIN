namespace Biin.Domain.Entities;

public class Localidad
{
    public int IdLocalidad { get; set; }
    public int IdMunicipio { get; set; }
    public string Nombre { get; set; } = string.Empty;

    public Municipio Municipio { get; set; } = null!;
    public ICollection<Ubicacion> Ubicaciones { get; set; } = new List<Ubicacion>();
}
