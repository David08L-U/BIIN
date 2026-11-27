using Biin.Application.DTOs.Contenidos;
using Biin.Domain.Enums;

namespace Biin.Application.DTOs.Transporte;

public record FiltroRutasRequest(
    int? IdLocalidadOrigen = null,
    int? IdLocalidadDestino = null,
    int? IdMunicipioOrigen = null,
    int? IdMunicipioDestino = null,
    string? Origen = null,
    string? Destino = null,
    short? DiaSemana = null,
    string? Busqueda = null,
    int Pagina = 1,
    int Tamano = 20);

public record FiltroRutasCercanasRequest(
    decimal Lat,
    decimal Lng,
    double RadioKm = 15.0,
    int Limite = 10);

public record RutaResumenDto(
    int IdRuta,
    string Codigo,
    string Titulo,
    string? Descripcion,
    string Origen,
    string Destino,
    int TotalParadas,
    decimal? TarifaAproximada,
    DateTime? ProximaSalida,
    string EstadoCupo,
    int? AsientosDisponibles,
    string? FotoPrincipal,
    DateTime ActualizadoEn);

public record RutaCercanaDto(
    int IdRuta,
    string Codigo,
    string Titulo,
    string DestinoFinal,
    int OrdenParadaAbordaje,
    string LocalidadParada,
    string? DireccionReferencia,
    decimal LatitudParada,
    decimal LongitudParada,
    double DistanciaKm,
    int MinutosEstimados,
    decimal? TarifaAproximada,
    DateTime ActualizadoEn);

public record HorarioRutaDto(
    int IdHorario,
    short DiaSemana,
    TimeOnly HoraSalida,
    DateOnly VigenteDesde,
    DateOnly? VigenteHasta);

public record RutaRegresoDto(
    int IdRuta,
    string Codigo,
    string Titulo,
    string Origen,
    string Destino,
    decimal? TarifaAproximada);

public record SalidaConCupoDto(
    int IdSalida,
    int IdRuta,
    string Unidad,
    DateTime SalidaProgramada,
    int CapacidadHabilitada,
    EstadoSalida EstadoSalida,
    string EstadoCupo,
    int? AsientosDisponibles,
    DateTime? RegistradoEn,
    DateTime? ValidoHasta);

public record SalidasRutaResponse(
    int IdRuta,
    string Codigo,
    string Titulo,
    DateOnly Fecha,
    IReadOnlyList<SalidaConCupoDto> Salidas);

/// <summary>Ficha completa de una ruta de transporte intermunicipal publicada (RF03, CU-03, RNF07).</summary>
public record RutaDetalleDto(
    int IdRuta,
    string Codigo,
    string Titulo,
    string? Descripcion,
    DateTime ActualizadoEn,
    string NotaTarifa,
    IReadOnlyList<FotografiaDto> Fotografias,
    IReadOnlyList<ParadaMapaDto> Paradas,
    IReadOnlyList<PuntoMapaDto> PuntosRecorrido,
    IReadOnlyList<HorarioRutaDto> Horarios,
    IReadOnlyList<TarifaVigenteDto> Tarifas,
    IReadOnlyList<RutaRegresoDto> RutasRegreso,
    IReadOnlyList<SalidaConCupoDto> ProximasSalidas);
