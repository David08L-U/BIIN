namespace Biin.Domain.Entities;

public class HorarioRuta
{
    public int IdHorario { get; set; }
    public int IdRuta { get; set; }
    /// <summary>0 = domingo, 6 = sábado.</summary>
    public short DiaSemana { get; set; }
    public TimeOnly HoraSalida { get; set; }
    public DateOnly VigenteDesde { get; set; }
    public DateOnly? VigenteHasta { get; set; }

    public Ruta Ruta { get; set; } = null!;
}
