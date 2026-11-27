namespace Biin.Application.DTOs.Transporte;

public record FiltroUbicacionesCercanasRequest(
    decimal Lat,
    decimal Lng,
    double RadioKm = 15.0,
    int Limite = 10);

public record LocalidadCercanaDto(
    int IdLocalidad,
    string Localidad,
    int IdMunicipio,
    string Municipio,
    double DistanciaKm);

public record ParadaCercanaDto(
    int IdRuta,
    string CodigoRuta,
    string Ruta,
    int Orden,
    int IdUbicacion,
    string? DireccionReferencia,
    decimal Latitud,
    decimal Longitud,
    int IdLocalidad,
    string Localidad,
    int IdMunicipio,
    string Municipio,
    double DistanciaKm,
    int MinutosEstimados);

/// <summary>Sugerencias de origen cercanas a la ubicación actual del viajero (RF02, RNF05).</summary>
public record UbicacionesCercanasResponse(
    decimal LatitudConsulta,
    decimal LongitudConsulta,
    double RadioKm,
    IReadOnlyList<LocalidadCercanaDto> LocalidadesCercanas,
    IReadOnlyList<ParadaCercanaDto> ParadasAbordajeCercanas);
