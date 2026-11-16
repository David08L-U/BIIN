namespace Biin.Domain.Entities;

/// <summary>Un recorrido en un solo sentido; ida y regreso son rutas distintas.</summary>
public class Ruta
{
    public int IdRecurso { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public bool Activa { get; set; } = true;

    public Recurso Recurso { get; set; } = null!;
    public ICollection<RutaParada> Paradas { get; set; } = new List<RutaParada>();
    public ICollection<PuntoRecorrido> Puntos { get; set; } = new List<PuntoRecorrido>();
    public ICollection<HorarioRuta> Horarios { get; set; } = new List<HorarioRuta>();
    public ICollection<Tarifa> Tarifas { get; set; } = new List<Tarifa>();
    public ICollection<Salida> Salidas { get; set; } = new List<Salida>();
    public ICollection<OperadorRuta> Operadores { get; set; } = new List<OperadorRuta>();
}
