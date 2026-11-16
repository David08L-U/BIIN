namespace Biin.Domain.Entities;

public class ReporteCupo
{
    public int IdReporte { get; set; }
    public int IdSalida { get; set; }
    public int IdAutor { get; set; }
    public int AsientosDisponibles { get; set; }
    public DateTime RegistradoEn { get; set; }
    public DateTime ValidoHasta { get; set; }

    public Salida Salida { get; set; } = null!;
    public Usuario Autor { get; set; } = null!;

    public bool EstaVigente(DateTime ahoraUtc) => ahoraUtc <= ValidoHasta;
}
