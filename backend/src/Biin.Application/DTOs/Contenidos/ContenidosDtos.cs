using Biin.Domain.Enums;

namespace Biin.Application.DTOs.Contenidos;

// Piezas comunes de negocios, eventos y lugares (RF05, RF06, RF07)

public record UbicacionDto(
    int IdUbicacion,
    string? DireccionReferencia,
    decimal Latitud,
    decimal Longitud,
    int IdLocalidad,
    string Localidad,
    int IdMunicipio,
    string Municipio);

/// <summary>Horario semanal; <c>DiaSemana</c> 0 = domingo … 6 = sábado.</summary>
public record HorarioVisitaDto(short DiaSemana, TimeOnly HoraApertura, TimeOnly HoraCierre);

public record FotografiaDto(int IdFotografia, string UrlArchivo, string TextoAlternativo, int Orden);

public record CategoriaResumenDto(int IdCategoria, string Nombre);

// Negocios gastronómicos (RF05, CU-05)

public record FiltroNegociosRequest(
    string? Busqueda = null,
    int? IdMunicipio = null,
    int? IdLocalidad = null,
    int? IdCategoria = null,
    /// <summary>Presupuesto por persona: excluye negocios cuyo precio mínimo lo supera.</summary>
    decimal? PrecioMaximo = null,
    int Pagina = 1,
    int Tamano = 20);

/// <summary><c>AbiertoAhora</c> es null cuando el negocio no tiene horarios registrados (dato no confirmado, RNF07).</summary>
public record NegocioResumenDto(
    int IdRecurso,
    string Titulo,
    string? Descripcion,
    string Localidad,
    string Municipio,
    decimal Latitud,
    decimal Longitud,
    decimal? PrecioMinimoAprox,
    decimal? PrecioMaximoAprox,
    IReadOnlyList<string> Categorias,
    string? FotoPrincipal,
    bool? AbiertoAhora,
    DateTime ActualizadoEn);

public record NegocioDetalleDto(
    int IdRecurso,
    string Titulo,
    string? Descripcion,
    string? Telefono,
    decimal? PrecioMinimoAprox,
    decimal? PrecioMaximoAprox,
    UbicacionDto Ubicacion,
    IReadOnlyList<CategoriaResumenDto> Categorias,
    IReadOnlyList<FotografiaDto> Fotografias,
    IReadOnlyList<HorarioVisitaDto> Horarios,
    bool? AbiertoAhora,
    DateTime ActualizadoEn);

// Eventos (RF06, CU-06)

/// <summary>
/// Sin <c>Desde</c> se listan los eventos que aún no terminan. Las fechas son días en hora de Yucatán.
/// Los cancelados se incluyen (con su estado) para que el viajero sepa del cambio, salvo que se filtre por <c>Estado</c>.
/// </summary>
public record FiltroEventosRequest(
    string? Busqueda = null,
    int? IdMunicipio = null,
    int? IdLocalidad = null,
    int? IdCategoria = null,
    DateOnly? Desde = null,
    DateOnly? Hasta = null,
    EstadoEvento? Estado = null,
    int Pagina = 1,
    int Tamano = 20);

public record EventoResumenDto(
    int IdRecurso,
    string Titulo,
    string? Descripcion,
    DateTime Inicio,
    DateTime Fin,
    decimal? CostoEntrada,
    EstadoEvento EstadoEvento,
    string Localidad,
    string Municipio,
    decimal Latitud,
    decimal Longitud,
    IReadOnlyList<string> Categorias,
    string? FotoPrincipal,
    DateTime ActualizadoEn);

public record EventoDetalleDto(
    int IdRecurso,
    string Titulo,
    string? Descripcion,
    DateTime Inicio,
    DateTime Fin,
    decimal? CostoEntrada,
    EstadoEvento EstadoEvento,
    string? ContactoOrganizador,
    UbicacionDto Ubicacion,
    IReadOnlyList<CategoriaResumenDto> Categorias,
    IReadOnlyList<FotografiaDto> Fotografias,
    DateTime ActualizadoEn);

// Lugares de interés (RF07, CU-07)

public record FiltroLugaresRequest(
    string? Busqueda = null,
    int? IdMunicipio = null,
    int? IdLocalidad = null,
    int? IdCategoria = null,
    /// <summary>Costo de acceso máximo; 0 devuelve solo lugares gratuitos.</summary>
    decimal? CostoMaximo = null,
    int Pagina = 1,
    int Tamano = 20);

public record LugarResumenDto(
    int IdRecurso,
    string Titulo,
    string? Descripcion,
    string Localidad,
    string Municipio,
    decimal Latitud,
    decimal Longitud,
    decimal? CostoAcceso,
    IReadOnlyList<string> Categorias,
    string? FotoPrincipal,
    bool? AbiertoAhora,
    DateTime ActualizadoEn);

public record LugarDetalleDto(
    int IdRecurso,
    string Titulo,
    string? Descripcion,
    decimal? CostoAcceso,
    string? CondicionesAcceso,
    UbicacionDto Ubicacion,
    IReadOnlyList<CategoriaResumenDto> Categorias,
    IReadOnlyList<FotografiaDto> Fotografias,
    IReadOnlyList<HorarioVisitaDto> Horarios,
    bool? AbiertoAhora,
    DateTime ActualizadoEn);

// Explorar por interés (CU-14)

public record FiltroExplorarRequest(
    int? IdCategoria = null,
    TipoRecurso? Tipo = null,
    string? Busqueda = null,
    int? IdMunicipio = null,
    int? IdLocalidad = null,
    int Pagina = 1,
    int Tamano = 20,
    decimal? Lat = null,
    decimal? Lng = null,
    double? RadioKm = null);

public record RecursoExploradoDto(
    int IdRecurso,
    TipoRecurso Tipo,
    string Titulo,
    string? Descripcion,
    string? Localidad,
    string? Municipio,
    decimal? Latitud,
    decimal? Longitud,
    IReadOnlyList<string> Categorias,
    DateTime ActualizadoEn,
    double? DistanciaKm = null);
