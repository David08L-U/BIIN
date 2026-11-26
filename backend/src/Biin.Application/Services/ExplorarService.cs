using Biin.Application.Consultas;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Interfaces;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>
/// Explorar turismo por interés (CU-14): negocios, eventos y lugares de una categoría en una sola lista.
/// Parte de la vista v_recursos_publicados, así que nunca devuelve contenido pendiente o archivado.
/// </summary>
public class ExplorarService(IAppDbContext db, IReloj reloj)
{
    public async Task<PaginaResultado<RecursoExploradoDto>> ExplorarAsync(
        FiltroExplorarRequest filtro,
        CancellationToken ct = default)
    {
        if (filtro.Tipo == TipoRecurso.Ruta)
            throw new ReglaNegocioException("Las rutas se consultan en la búsqueda de transporte, no en explorar.");

        var (pagina, tamano) = Paginacion.Normalizar(filtro.Pagina, filtro.Tamano);
        var ahora = reloj.AhoraUtc;

        // Los eventos que ya terminaron no se recomiendan
        var idsEventosTerminados = db.Eventos.Where(e => e.Fin < ahora).Select(e => e.IdRecurso);

        var consulta = db.VRecursosPublicados
            .AsNoTracking()
            .Where(v => v.Tipo != TipoRecurso.Ruta)
            .Where(v => !idsEventosTerminados.Contains(v.IdRecurso));

        if (filtro.Tipo.HasValue)
            consulta = consulta.Where(v => v.Tipo == filtro.Tipo.Value);

        if (filtro.IdCategoria.HasValue)
        {
            var idsEnCategoria = db.RecursoCategorias
                .Where(rc => rc.IdCategoria == filtro.IdCategoria.Value)
                .Select(rc => rc.IdRecurso);
            consulta = consulta.Where(v => idsEnCategoria.Contains(v.IdRecurso));
        }

        if (filtro.IdLocalidad.HasValue)
            consulta = consulta.Where(v => v.IdLocalidad == filtro.IdLocalidad.Value);

        if (filtro.IdMunicipio.HasValue)
            consulta = consulta.Where(v => v.IdMunicipio == filtro.IdMunicipio.Value);

        var texto = FuncionesBd.NormalizarTexto(filtro.Busqueda?.Trim());
        if (texto.Length > 0)
            consulta = consulta.Where(v =>
                FuncionesBd.Normalizar(v.Titulo).Contains(texto) ||
                FuncionesBd.Normalizar(v.Descripcion ?? string.Empty).Contains(texto));

        var total = await consulta.CountAsync(ct);
        var recursos = await consulta
            .OrderBy(v => v.Titulo)
            .ThenBy(v => v.IdRecurso)
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .ToListAsync(ct);

        var ids = recursos.Select(r => r.IdRecurso).ToList();
        var categorias = await db.RecursoCategorias
            .AsNoTracking()
            .Where(rc => ids.Contains(rc.IdRecurso))
            .Select(rc => new { rc.IdRecurso, rc.Categoria.Nombre })
            .ToListAsync(ct);
        var categoriasPorRecurso = categorias
            .GroupBy(c => c.IdRecurso)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<string>)g.Select(c => c.Nombre).OrderBy(n => n).ToList());

        var items = recursos.Select(r => new RecursoExploradoDto(
            r.IdRecurso,
            r.Tipo,
            r.Titulo,
            r.Descripcion,
            r.Localidad,
            r.Municipio,
            r.Latitud,
            r.Longitud,
            categoriasPorRecurso.GetValueOrDefault(r.IdRecurso, []),
            r.ActualizadoEn)).ToList();

        return new PaginaResultado<RecursoExploradoDto>(items, total, pagina, tamano);
    }
}
