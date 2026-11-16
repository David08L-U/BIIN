namespace Biin.Domain.Entities;

/// <summary>Tarifa aproximada de un tramo entre dos paradas de la misma ruta.</summary>
public class Tarifa
{
    public int IdTarifa { get; set; }
    public int IdRuta { get; set; }
    public int OrdenOrigen { get; set; }
    public int OrdenDestino { get; set; }
    public decimal Monto { get; set; }
    public DateOnly VigenteDesde { get; set; }
    public DateOnly? VigenteHasta { get; set; }

    public Ruta Ruta { get; set; } = null!;

    public bool EsVigente(DateOnly fecha) =>
        fecha >= VigenteDesde && (VigenteHasta is null || fecha <= VigenteHasta);
}
