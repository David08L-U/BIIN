using System.ComponentModel.DataAnnotations;
using Biin.Application.DTOs.Contenidos;
using Biin.Domain.Enums;

namespace Biin.Application.DTOs.Admin;

// Gestión administrativa de negocios, eventos y lugares (CU-12, RF12, paquete 17.1)

public record FiltroContenidosAdminRequest(
    TipoRecurso? Tipo = null,
    EstadoPublicacion? Estado = null,
    string? Busqueda = null,
    int Pagina = 1,
    int Tamano = 20);

/// <summary>Vista de administración: incluye estado de publicación, creador y revisor.</summary>
public record ContenidoAdminDto(
    int IdRecurso,
    TipoRecurso Tipo,
    string Titulo,
    string? Descripcion,
    EstadoPublicacion EstadoPublicacion,
    string Creador,
    string? Revisor,
    DateTime? FechaRevision,
    DateTime ActualizadoEn,
    string? Localidad,
    IReadOnlyList<string> Categorias);

public record GuardarNegocioRequest(
    [Required(ErrorMessage = "El título es obligatorio.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "El título debe tener entre 3 y 150 caracteres.")]
    string Titulo,
    string? Descripcion,
    int IdUbicacion,
    [StringLength(20, ErrorMessage = "El teléfono no puede pasar de 20 caracteres.")]
    string? Telefono,
    decimal? PrecioMinimoAprox,
    decimal? PrecioMaximoAprox,
    IReadOnlyList<int>? IdCategorias = null);

public record GuardarLugarRequest(
    [Required(ErrorMessage = "El título es obligatorio.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "El título debe tener entre 3 y 150 caracteres.")]
    string Titulo,
    string? Descripcion,
    int IdUbicacion,
    decimal? CostoAcceso,
    string? CondicionesAcceso,
    IReadOnlyList<int>? IdCategorias = null);

/// <summary>Inicio y fin en UTC (ISO 8601 con zona).</summary>
public record GuardarEventoRequest(
    [Required(ErrorMessage = "El título es obligatorio.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "El título debe tener entre 3 y 150 caracteres.")]
    string Titulo,
    string? Descripcion,
    int IdUbicacion,
    DateTime Inicio,
    DateTime Fin,
    decimal? CostoEntrada,
    [StringLength(150, ErrorMessage = "El contacto no puede pasar de 150 caracteres.")]
    string? ContactoOrganizador,
    IReadOnlyList<int>? IdCategorias = null);

public record CambiarEstadoEventoRequest(EstadoEvento EstadoEvento);

/// <summary>Reemplaza todos los horarios de visita de un negocio o lugar.</summary>
public record ReemplazarHorariosRequest(
    [Required(ErrorMessage = "Debe indicar la lista de horarios (puede ir vacía).")]
    IReadOnlyList<HorarioVisitaDto> Horarios);

public record AgregarFotografiaRequest(
    [Required(ErrorMessage = "La URL del archivo es obligatoria.")]
    [StringLength(500, ErrorMessage = "La URL no puede pasar de 500 caracteres.")]
    string UrlArchivo,
    [Required(ErrorMessage = "El texto alternativo es obligatorio para accesibilidad (RNF06).")]
    [StringLength(255, MinimumLength = 3, ErrorMessage = "El texto alternativo debe tener entre 3 y 255 caracteres.")]
    string TextoAlternativo);

// Geografía: localidades y ubicaciones para registrar contenidos

public record CrearLocalidadRequest(
    int IdMunicipio,
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(120, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 120 caracteres.")]
    string Nombre);

public record ActualizarLocalidadRequest(
    int IdMunicipio,
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(120, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 120 caracteres.")]
    string Nombre);

public record CrearUbicacionRequest(
    int IdLocalidad,
    [StringLength(255, ErrorMessage = "La referencia no puede pasar de 255 caracteres.")]
    string? DireccionReferencia,
    [Range(-90, 90, ErrorMessage = "La latitud debe estar entre -90 y 90.")]
    decimal Latitud,
    [Range(-180, 180, ErrorMessage = "La longitud debe estar entre -180 y 180.")]
    decimal Longitud);

public record ActualizarUbicacionRequest(
    int IdLocalidad,
    [StringLength(255, ErrorMessage = "La referencia no puede pasar de 255 caracteres.")]
    string? DireccionReferencia,
    [Range(-90, 90, ErrorMessage = "La latitud debe estar entre -90 y 90.")]
    decimal Latitud,
    [Range(-180, 180, ErrorMessage = "La longitud debe estar entre -180 y 180.")]
    decimal Longitud);

// Bitácora administrativa (paquete 17.1.5)

public record FiltroBitacoraRequest(
    string? Tabla = null,
    int? IdUsuario = null,
    string? Accion = null,
    DateOnly? Desde = null,
    DateOnly? Hasta = null,
    int Pagina = 1,
    int Tamano = 50);

/// <summary><c>Detalle</c> es el JSON guardado en bitacora_admin.detalle, tal cual.</summary>
public record BitacoraDto(
    long IdBitacora,
    int IdUsuario,
    string Usuario,
    string Accion,
    string Tabla,
    string IdRegistro,
    string? Detalle,
    DateTime Fecha);
