using Biin.Domain.Enums;

namespace Biin.Domain.Vistas;

/// <summary>
/// Fila de la vista <c>v_cupo_vigente</c>: por salida, el último reporte vigente
/// o <c>no_confirmado</c> si no hay (RF04, RNF07).
/// </summary>
public class VCupoVigente
{
    public const string EstadoVigente = "vigente";
    public const string EstadoNoConfirmado = "no_confirmado";

    public int IdSalida { get; set; }
    public int IdRuta { get; set; }
    public DateTime SalidaProgramada { get; set; }
    public int CapacidadHabilitada { get; set; }
    public EstadoSalida EstadoSalida { get; set; }
    public int? AsientosDisponibles { get; set; }
    public DateTime? RegistradoEn { get; set; }
    public DateTime? ValidoHasta { get; set; }
    public string EstadoCupo { get; set; } = EstadoNoConfirmado;
}
