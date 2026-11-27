using System.ComponentModel.DataAnnotations;
using Biin.Application.DTOs.Contenidos;
using Biin.Domain.Enums;

namespace Biin.Application.DTOs.Admin;

public record FiltroAdminRecorridosRequest(
    EstadoPublicacion? Estado = null,
    int? IdLocalidadBase = null,
    string? Busqueda = null,
    int Pagina = 1,
    int Tamano = 20);

public record RecorridoAdminResumenDto(
    int IdRecorrido,
    string Titulo,
    string? Descripcion,
    int IdLocalidadBase,
    string LocalidadBase,
    EstadoPublicacion EstadoPublicacion,
    int TotalEtapas,
    int DuracionTotalMin,
    DateTime ActualizadoEn);

public record RecorridoAdminDetalleDto(
    int IdRecorrido,
    string Titulo,
    string? Descripcion,
    int IdLocalidadBase,
    string LocalidadBase,
    int IdMunicipio,
    string Municipio,
    EstadoPublicacion EstadoPublicacion,
    int DuracionTotalMin,
    DateTime ActualizadoEn,
    IReadOnlyList<EtapaRecorridoDto> Etapas);

public record EtapaRecorridoInput(
    [Range(1, int.MaxValue, ErrorMessage = "El identificador del recurso debe ser mayor a cero.")]
    int IdRecurso,

    [Range(1, 1440, ErrorMessage = "La duración sugerida debe estar entre 1 y 1440 minutos.")]
    int? DuracionSugeridaMin = null);

public record CrearRecorridoRequest(
    [Required(ErrorMessage = "El título es obligatorio.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "El título debe tener entre 3 y 150 caracteres.")]
    string Titulo,

    string? Descripcion,

    [Range(1, int.MaxValue, ErrorMessage = "La localidad base es obligatoria.")]
    int IdLocalidadBase,

    IReadOnlyList<EtapaRecorridoInput>? Etapas = null);

public record ActualizarRecorridoRequest(
    [Required(ErrorMessage = "El título es obligatorio.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "El título debe tener entre 3 y 150 caracteres.")]
    string Titulo,

    string? Descripcion,

    [Range(1, int.MaxValue, ErrorMessage = "La localidad base es obligatoria.")]
    int IdLocalidadBase);

public record ReemplazarEtapasRecorridoRequest(
    [Required(ErrorMessage = "Debes indicar las etapas del recorrido.")]
    IReadOnlyList<EtapaRecorridoInput> Etapas);
