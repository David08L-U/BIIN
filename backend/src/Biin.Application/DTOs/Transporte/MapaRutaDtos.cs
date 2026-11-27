namespace Biin.Application.DTOs.Transporte;

public record PuntoMapaDto(int Orden, decimal Latitud, decimal Longitud);

public record ParadaMapaDto(
    int Orden,
    int IdUbicacion,
    string? DireccionReferencia,
    decimal Latitud,
    decimal Longitud,
    int IdLocalidad,
    string Localidad,
    int IdMunicipio,
    string Municipio,
    bool PermiteAbordar,
    bool PermiteDescender);

/// <summary>Paradas ordenadas y trazo polyline listos para renderizar una ruta en Leaflet (RF03, CU-03).</summary>
public record MapaRutaResponse(
    int IdRuta,
    string Codigo,
    string Titulo,
    DateTime ActualizadoEn,
    IReadOnlyList<ParadaMapaDto> Paradas,
    IReadOnlyList<PuntoMapaDto> PuntosRecorrido);
