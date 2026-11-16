namespace Biin.Domain.Entities;

public class EtapaRecorrido
{
    public int IdRecorrido { get; set; }
    public int Orden { get; set; }
    public int IdRecurso { get; set; }
    public int? DuracionSugeridaMin { get; set; }

    public RecorridoSugerido Recorrido { get; set; } = null!;
    public Recurso Recurso { get; set; } = null!;
}
