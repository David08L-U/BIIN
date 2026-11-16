namespace Biin.Domain.Entities;

public class ActividadItinerario
{
    public int IdActividad { get; set; }
    public int IdItinerario { get; set; }
    public int IdRecurso { get; set; }
    public int Orden { get; set; }
    public DateTime? InicioPrevisto { get; set; }
    public DateTime? FinPrevisto { get; set; }
    public string? Notas { get; set; }

    public Itinerario Itinerario { get; set; } = null!;
    public Recurso Recurso { get; set; } = null!;

    /// <summary>True si los horarios de ambas actividades se enciman.</summary>
    public bool TieneConflictoCon(ActividadItinerario otra) =>
        InicioPrevisto is not null && FinPrevisto is not null &&
        otra.InicioPrevisto is not null && otra.FinPrevisto is not null &&
        InicioPrevisto < otra.FinPrevisto && otra.InicioPrevisto < FinPrevisto;
}
