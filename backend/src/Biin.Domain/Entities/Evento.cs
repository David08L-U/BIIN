using Biin.Domain.Enums;

namespace Biin.Domain.Entities;

public class Evento
{
    public int IdRecurso { get; set; }
    public int IdUbicacion { get; set; }
    public DateTime Inicio { get; set; }
    public DateTime Fin { get; set; }
    public decimal? CostoEntrada { get; set; }
    public EstadoEvento EstadoEvento { get; set; } = EstadoEvento.Programado;
    public string? ContactoOrganizador { get; set; }

    public Recurso Recurso { get; set; } = null!;
    public Ubicacion Ubicacion { get; set; } = null!;
}
