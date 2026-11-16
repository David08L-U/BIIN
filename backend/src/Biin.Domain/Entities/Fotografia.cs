namespace Biin.Domain.Entities;

public class Fotografia
{
    public int IdFotografia { get; set; }
    public int IdRecurso { get; set; }
    public string UrlArchivo { get; set; } = string.Empty;
    public string TextoAlternativo { get; set; } = string.Empty;
    public int Orden { get; set; }

    public Recurso Recurso { get; set; } = null!;
}
