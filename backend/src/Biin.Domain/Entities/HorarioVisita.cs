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

    /// <summary>True si el cierre es al día siguiente (por ejemplo de 18:00 a 02:00).</summary>
    public bool CruzaMedianoche => HoraCierre <= HoraApertura;

    /// <summary>
    /// Indica si este horario cubre el momento local indicado. Un horario que cruza la medianoche
    /// cubre desde la apertura del día <see cref="DiaSemana"/> hasta el cierre del día siguiente.
    /// </summary>
    public bool CubreMomento(DateTime local)
    {
        var dia = (short)local.DayOfWeek;
        var hora = TimeOnly.FromDateTime(local);

        if (!CruzaMedianoche)
            return dia == DiaSemana && hora >= HoraApertura && hora < HoraCierre;

        var diaSiguiente = (short)((DiaSemana + 1) % 7);
        return (dia == DiaSemana && hora >= HoraApertura) ||
               (dia == diaSiguiente && hora < HoraCierre);
    }

    /// <summary>True si alguno de los horarios cubre el momento local indicado.</summary>
    public static bool EstaAbierto(IEnumerable<HorarioVisita> horarios, DateTime local) =>
        horarios.Any(h => h.CubreMomento(local));
}
