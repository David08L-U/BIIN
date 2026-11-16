namespace Biin.Domain.Entities;

public class Itinerario
{
    public int IdItinerario { get; set; }
    public int IdUsuario { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public DateOnly Inicio { get; set; }
    public DateOnly Fin { get; set; }
    public decimal? PresupuestoEstimado { get; set; }
    public DateTime FechaCreacion { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public ICollection<ActividadItinerario> Actividades { get; set; } = new List<ActividadItinerario>();
}
