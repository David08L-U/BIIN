namespace Biin.Domain.Entities;

public class Rol
{
    public int IdRol { get; set; }
    public string Nombre { get; set; } = string.Empty;

    public ICollection<UsuarioRol> Usuarios { get; set; } = new List<UsuarioRol>();
}
