namespace Biin.Domain.Vistas;

/// <summary>
/// Fila de la vista <c>v_paradas_ruta</c>: paradas en orden de cada ruta activa y publicada,
/// con su localidad y municipio. Base de la búsqueda origen → destino (CU-02).
/// </summary>
public class VParadaRuta
{
    public int IdRuta { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Ruta { get; set; } = string.Empty;
    public int Orden { get; set; }
    public bool PermiteAbordar { get; set; }
    public bool PermiteDescender { get; set; }
    public int IdUbicacion { get; set; }
    public string? DireccionReferencia { get; set; }
    public decimal Latitud { get; set; }
    public decimal Longitud { get; set; }
    public int IdLocalidad { get; set; }
    public string Localidad { get; set; } = string.Empty;
    public int IdMunicipio { get; set; }
    public string Municipio { get; set; } = string.Empty;
}
