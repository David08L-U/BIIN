namespace Biin.Application.DTOs.Transporte;

public record FiltroTarifasRutaRequest(
    int? OrdenOrigen = null,
    int? OrdenDestino = null,
    DateOnly? Fecha = null);

public record TarifaVigenteDto(
    int IdTarifa,
    int IdRuta,
    int OrdenOrigen,
    string LocalidadOrigen,
    int OrdenDestino,
    string LocalidadDestino,
    decimal Monto,
    DateOnly VigenteDesde,
    DateOnly? VigenteHasta);

/// <summary>Tarifas aproximadas vigentes de una ruta publicada (RF03, RNF07, CU-03).</summary>
public record TarifasRutaResponse(
    int IdRuta,
    string Codigo,
    string Titulo,
    DateOnly FechaConsulta,
    DateTime ActualizadoEn,
    string NotaTarifa,
    IReadOnlyList<TarifaVigenteDto> Tarifas);
