using Biin.Domain.Enums;

namespace Biin.Domain.Entities;

/// <summary>Datos generales de todo contenido: ruta, negocio, evento o lugar.</summary>
public class Recurso
{
    public int IdRecurso { get; set; }
    public TipoRecurso Tipo { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public EstadoPublicacion EstadoPublicacion { get; set; } = EstadoPublicacion.Pendiente;
    public int IdCreador { get; set; }
    public int? IdRevisor { get; set; }
    public DateTime? FechaRevision { get; set; }
    public DateTime ActualizadoEn { get; set; }

    public Usuario Creador { get; set; } = null!;
    public Usuario? Revisor { get; set; }

    public Ruta? Ruta { get; set; }
    public Negocio? Negocio { get; set; }
    public Evento? Evento { get; set; }
    public Lugar? Lugar { get; set; }

    public ICollection<RecursoCategoria> Categorias { get; set; } = new List<RecursoCategoria>();
    public ICollection<Fotografia> Fotografias { get; set; } = new List<Fotografia>();
    public ICollection<HorarioVisita> HorariosVisita { get; set; } = new List<HorarioVisita>();
}
