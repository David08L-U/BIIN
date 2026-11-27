using Biin.Domain.Enums;

namespace Biin.Application.DTOs.Contenidos;

public record FiltroRecorridosRequest(
    string? Busqueda = null,
    int? IdMunicipio = null,
    int? IdLocalidadBase = null,
    int Pagina = 1,
    int Tamano = 20);

public record RecorridoResumenDto(
    int IdRecorrido,
    string Titulo,
    string? Descripcion,
    int IdLocalidadBase,
    string LocalidadBase,
    int IdMunicipio,
    string Municipio,
    int TotalEtapas,
    int DuracionTotalMin,
    string? FotoPrincipal,
    DateTime ActualizadoEn);

/// <summary>
/// Etapa ordenada de un recorrido sugerido (CU-13). Si el recurso dejó de estar publicado o
/// es un evento cancelado, <c>Disponible</c> es false y <c>Aviso</c> informa el cambio sin romper el detalle (RNF07).
/// </summary>
public record EtapaRecorridoDto(
    int Orden,
    int IdRecurso,
    TipoRecurso Tipo,
    string Titulo,
    string? Descripcion,
    int? DuracionSugeridaMin,
    decimal? Latitud,
    decimal? Longitud,
    string? Localidad,
    string? FotoPrincipal,
    bool Disponible,
    string? Aviso);

public record RecorridoDetalleDto(
    int IdRecorrido,
    string Titulo,
    string? Descripcion,
    int IdLocalidadBase,
    string LocalidadBase,
    int IdMunicipio,
    string Municipio,
    int DuracionTotalMin,
    DateTime ActualizadoEn,
    IReadOnlyList<EtapaRecorridoDto> Etapas);
