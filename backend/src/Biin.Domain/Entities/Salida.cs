using Biin.Domain.Enums;

namespace Biin.Domain.Entities;

/// <summary>Un viaje concreto de una unidad en una ruta.</summary>
public class Salida
{
    public int IdSalida { get; set; }
    public int IdRuta { get; set; }
    public int IdUnidad { get; set; }
    public DateTime SalidaProgramada { get; set; }
    public int CapacidadHabilitada { get; set; }
    public EstadoSalida Estado { get; set; } = EstadoSalida.Programada;

    public Ruta Ruta { get; set; } = null!;
    public Unidad Unidad { get; set; } = null!;
    public ICollection<ReporteCupo> ReportesCupo { get; set; } = new List<ReporteCupo>();
}
