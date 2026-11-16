namespace Biin.Domain.Entities;

public class Categoria
{
    public int IdCategoria { get; set; }
    public string Nombre { get; set; } = string.Empty;

    public ICollection<RecursoCategoria> Recursos { get; set; } = new List<RecursoCategoria>();
}
