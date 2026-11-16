namespace Biin.Domain.Entities;

public class RecursoCategoria
{
    public int IdRecurso { get; set; }
    public int IdCategoria { get; set; }

    public Recurso Recurso { get; set; } = null!;
    public Categoria Categoria { get; set; } = null!;
}
