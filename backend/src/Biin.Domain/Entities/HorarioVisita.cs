namespace Biin.Domain.Entities;

public class HorarioVisita
{
    public int IdHorario { get; set; }
    public int IdRecurso { get; set; }
    /// <summary>0 = domingo, 6 = sábado.</summary>
    public short DiaSemana { get; set; }
    public TimeOnly HoraApertura { get; set; }
    public TimeOnly HoraCierre { get; set; }

    public Recurso Recurso { get; set; } = null!;
}
