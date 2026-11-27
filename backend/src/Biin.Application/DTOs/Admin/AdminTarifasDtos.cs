using System.ComponentModel.DataAnnotations;

namespace Biin.Application.DTOs.Admin;

public record TarifaAdminDto(
    int IdTarifa,
    int IdRuta,
    int OrdenOrigen,
    string LocalidadOrigen,
    int OrdenDestino,
    string LocalidadDestino,
    decimal Monto,
    DateOnly VigenteDesde,
    DateOnly? VigenteHasta,
    bool VigenteHoy);

public record CrearTarifaRequest(
    [Range(1, int.MaxValue, ErrorMessage = "El orden de origen debe ser mayor a cero.")]
    int OrdenOrigen,

    [Range(1, int.MaxValue, ErrorMessage = "El orden de destino debe ser mayor a cero.")]
    int OrdenDestino,

    [Range(0, 100000, ErrorMessage = "El monto debe ser mayor o igual a cero.")]
    decimal Monto,

    DateOnly VigenteDesde,
    DateOnly? VigenteHasta = null);

public record ActualizarTarifaRequest(
    [Range(0, 100000, ErrorMessage = "El monto debe ser mayor o igual a cero.")]
    decimal Monto,

    DateOnly VigenteDesde,
    DateOnly? VigenteHasta = null);

public record CerrarVigenciaTarifaRequest(DateOnly VigenteHasta);
