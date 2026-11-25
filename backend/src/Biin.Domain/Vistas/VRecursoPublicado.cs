using Biin.Domain.Enums;

namespace Biin.Domain.Vistas;

/// <summary>
/// Fila de la vista <c>v_recursos_publicados</c>: solo contenido publicado con su ubicación.
/// Es lo único que deben ver el público y el asistente de IA (RF08).
/// </summary>
public class VRecursoPublicado
{
    public int IdRecurso { get; set; }
    public TipoRecurso Tipo { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime ActualizadoEn { get; set; }
    public int? IdUbicacion { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
    public int? IdLocalidad { get; set; }
    public string? Localidad { get; set; }
    public int? IdMunicipio { get; set; }
    public string? Municipio { get; set; }
}
