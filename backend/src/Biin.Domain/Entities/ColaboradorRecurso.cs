namespace Biin.Domain.Entities;

public class ColaboradorRecurso
{
    public int IdUsuario { get; set; }
    public int IdRecurso { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public Recurso Recurso { get; set; } = null!;
}
