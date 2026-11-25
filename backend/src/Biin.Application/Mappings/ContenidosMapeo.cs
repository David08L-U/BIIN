using Biin.Application.DTOs.Contenidos;
using Biin.Domain.Entities;

namespace Biin.Application.Mappings;

/// <summary>Conversión de entidades de contenido a DTOs públicos (sin datos internos como creador o revisor).</summary>
public static class ContenidosMapeo
{
    public static UbicacionDto AUbicacionDto(Ubicacion u) => new(
        u.IdUbicacion,
        u.DireccionReferencia,
        u.Latitud,
        u.Longitud,
        u.IdLocalidad,
        u.Localidad.Nombre,
        u.Localidad.IdMunicipio,
        u.Localidad.Municipio.Nombre);

    public static IReadOnlyList<string> NombresCategorias(Recurso r) =>
        r.Categorias.Select(c => c.Categoria.Nombre).OrderBy(n => n).ToList();

    public static IReadOnlyList<CategoriaResumenDto> Categorias(Recurso r) =>
        r.Categorias
            .Select(c => new CategoriaResumenDto(c.IdCategoria, c.Categoria.Nombre))
            .OrderBy(c => c.Nombre)
            .ToList();

    public static IReadOnlyList<FotografiaDto> Fotografias(Recurso r) =>
        r.Fotografias
            .OrderBy(f => f.Orden)
            .Select(f => new FotografiaDto(f.IdFotografia, f.UrlArchivo, f.TextoAlternativo, f.Orden))
            .ToList();

    /// <summary>URL de la foto con menor orden, o null si no hay fotos.</summary>
    public static string? FotoPrincipal(Recurso r) =>
        r.Fotografias.OrderBy(f => f.Orden).Select(f => f.UrlArchivo).FirstOrDefault();

    public static IReadOnlyList<HorarioVisitaDto> Horarios(Recurso r) =>
        r.HorariosVisita
            .OrderBy(h => h.DiaSemana)
            .ThenBy(h => h.HoraApertura)
            .Select(h => new HorarioVisitaDto(h.DiaSemana, h.HoraApertura, h.HoraCierre))
            .ToList();

    /// <summary>Null si no hay horarios registrados: no se presenta como cerrado algo que no se sabe (RNF07).</summary>
    public static bool? AbiertoAhora(Recurso r, DateTime ahoraLocal) =>
        r.HorariosVisita.Count == 0 ? null : HorarioVisita.EstaAbierto(r.HorariosVisita, ahoraLocal);
}
