namespace Biin.Domain.Entities;

public class Municipio
{
    public int IdMunicipio { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;

    public ICollection<Localidad> Localidades { get; set; } = new List<Localidad>();
}
