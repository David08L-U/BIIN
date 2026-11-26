using System.ComponentModel.DataAnnotations;
using Biin.Domain.Enums;

namespace Biin.Application.DTOs.Itinerarios;

// Módulo Mi Viaje: itinerarios del viajero registrado (RF09, CU-09, HU09)

public record CrearItinerarioRequest(
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(120, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 120 caracteres.")]
    string Nombre,
    DateOnly Inicio,
    DateOnly Fin,
    [Range(0, 9_999_999, ErrorMessage = "El presupuesto no puede ser negativo.")]
    decimal? PresupuestoEstimado = null);

public record ActualizarItinerarioRequest(
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(120, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 120 caracteres.")]
    string Nombre,
    DateOnly Inicio,
    DateOnly Fin,
    [Range(0, 9_999_999, ErrorMessage = "El presupuesto no puede ser negativo.")]
    decimal? PresupuestoEstimado = null);

/// <summary>Horas previstas en UTC (ISO 8601). Si el recurso es un evento y no se indican, se toman las del evento.</summary>
public record AgregarActividadRequest(
    int IdRecurso,
    DateTime? InicioPrevisto = null,
    DateTime? FinPrevisto = null,
    [StringLength(500, ErrorMessage = "Las notas no pueden pasar de 500 caracteres.")]
    string? Notas = null);

public record ActualizarActividadRequest(
    DateTime? InicioPrevisto,
    DateTime? FinPrevisto,
    [StringLength(500, ErrorMessage = "Las notas no pueden pasar de 500 caracteres.")]
    string? Notas);

/// <summary>Todas las actividades del itinerario en el nuevo orden.</summary>
public record ReordenarActividadesRequest(
    [Required(ErrorMessage = "Debe indicar el orden de las actividades.")]
    IReadOnlyList<int> IdActividades);

public record ItinerarioResumenDto(
    int IdItinerario,
    string Nombre,
    DateOnly Inicio,
    DateOnly Fin,
    decimal? PresupuestoEstimado,
    int TotalActividades,
    DateTime FechaCreacion);

/// <summary>Traslado estimado desde la actividad anterior (solo referencia, RF09).</summary>
public record TrasladoEstimadoDto(double DistanciaKm, int MinutosEstimados);

public record ActividadDto(
    int IdActividad,
    int Orden,
    int IdRecurso,
    TipoRecurso Tipo,
    string Titulo,
    bool Disponible,
    DateTime? InicioPrevisto,
    DateTime? FinPrevisto,
    string? Notas,
    string? Localidad,
    decimal? Latitud,
    decimal? Longitud,
    TrasladoEstimadoDto? TrasladoDesdeAnterior);

/// <summary>
/// Tipos: conflicto_horario, traslado_insuficiente, fuera_de_fechas, fuera_de_horario,
/// evento_cancelado y contenido_no_disponible.
/// </summary>
public record AdvertenciaDto(string Tipo, string Mensaje, IReadOnlyList<int> IdActividades);

public record ItinerarioDetalleDto(
    int IdItinerario,
    string Nombre,
    DateOnly Inicio,
    DateOnly Fin,
    decimal? PresupuestoEstimado,
    DateTime FechaCreacion,
    IReadOnlyList<ActividadDto> Actividades,
    IReadOnlyList<AdvertenciaDto> Advertencias);
