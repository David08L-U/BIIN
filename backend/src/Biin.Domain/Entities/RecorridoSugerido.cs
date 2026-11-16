using Biin.Domain.Enums;

namespace Biin.Domain.Entities;

/// <summary>Recorrido turístico sugerido por el equipo (CU-13).</summary>
public class RecorridoSugerido
{
    public int IdRecorrido { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int IdLocalidadBase { get; set; }
    public EstadoPublicacion EstadoPublicacion { get; set; } = EstadoPublicacion.Pendiente;
    public DateTime ActualizadoEn { get; set; }

    public Localidad LocalidadBase { get; set; } = null!;
    public ICollection<EtapaRecorrido> Etapas { get; set; } = new List<EtapaRecorrido>();
}
