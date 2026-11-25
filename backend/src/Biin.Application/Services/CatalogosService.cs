using Biin.Application.Consultas;
using Biin.Application.DTOs.Catalogos;
using Biin.Application.Interfaces;
using Biin.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>
/// Catálogos públicos para filtros de búsqueda: categorías (CU-14), municipios y localidades
/// (RF05, RF06, RF07). La búsqueda de localidades ignora acentos y mayúsculas.
/// </summary>
public class CatalogosService(IAppDbContext db)
{
    public const int LimiteLocalidades = 50;

    public async Task<IReadOnlyList<CategoriaDto>> ListarCategoriasAsync(CancellationToken ct = default) =>
        await db.Categorias
            .AsNoTracking()
            .OrderBy(c => c.Nombre)
            .Select(c => new CategoriaDto(
                c.IdCategoria,
                c.Nombre,
                c.Recursos.Count(rc =>
                    rc.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado &&
                    rc.Recurso.Tipo != TipoRecurso.Ruta)))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<MunicipioDto>> ListarMunicipiosAsync(CancellationToken ct = default) =>
        await db.Municipios
            .AsNoTracking()
            .OrderBy(m => m.Nombre)
            .Select(m => new MunicipioDto(m.IdMunicipio, m.Codigo, m.Nombre))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<LocalidadDto>> ListarLocalidadesAsync(
        int? idMunicipio,
        string? busqueda,
        CancellationToken ct = default)
    {
        var consulta = db.Localidades.AsNoTracking();

        if (idMunicipio.HasValue)
            consulta = consulta.Where(l => l.IdMunicipio == idMunicipio.Value);

        var texto = FuncionesBd.NormalizarTexto(busqueda?.Trim());
        if (texto.Length > 0)
            consulta = consulta.Where(l =>
                FuncionesBd.Normalizar(l.Nombre).Contains(texto) ||
                FuncionesBd.Normalizar(l.Municipio.Nombre).Contains(texto));

        return await consulta
            .OrderBy(l => l.Nombre)
            .ThenBy(l => l.Municipio.Nombre)
            .Take(LimiteLocalidades)
            .Select(l => new LocalidadDto(l.IdLocalidad, l.Nombre, l.IdMunicipio, l.Municipio.Nombre))
            .ToListAsync(ct);
    }
}
