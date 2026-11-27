using Biin.Application.Consultas;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Interfaces;
using Biin.Application.Validators;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.Domain.Vistas;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>
/// Explorar turismo por interés (CU-14): negocios, eventos y lugares de una categoría en una sola lista.
/// Parte de la vista v_recursos_publicados, así que nunca devuelve contenido pendiente o archivado.
/// Soporta filtrado y ordenamiento opcional por proximidad cuando el viajero consiente GPS (RNF05).
/// </summary>
public class ExplorarService(IAppDbContext db, IReloj reloj)
{
    public const double RadioPorDefectoKm = 25.0;

    public async Task<PaginaResultado<RecursoExploradoDto>> ExplorarAsync(
        FiltroExplorarRequest filtro,
        CancellationToken ct = default)
    {
        if (filtro.Tipo == TipoRecurso.Ruta)
            throw new ReglaNegocioException("Las rutas se consultan en la búsqueda de transporte, no en explorar.");

        var usarProximidad = ValidacionGeografia.ValidarProximidadOpcional(
            filtro.Lat, filtro.Lng, filtro.RadioKm, RadioPorDefectoKm, out var lat, out var lng, out var radioKm);

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

        int total;
        List<(VRecursoPublicado Recurso, double? DistanciaKm)> seleccionados;

        if (usarProximidad)
        {
            var candidatos = await consulta
                .Where(v => v.Latitud != null && v.Longitud != null)
                .ToListAsync(ct);

            var ordenados = candidatos
                .Select(v => (Recurso: v, Distancia: CalculadoraTraslado.DistanciaKm(lat, lng, v.Latitud!.Value, v.Longitud!.Value)))
                .Where(x => x.Distancia <= radioKm)
                .OrderBy(x => x.Distancia)
                .ThenBy(x => x.Recurso.Titulo)
                .ThenBy(x => x.Recurso.IdRecurso)
                .ToList();

            total = ordenados.Count;
            seleccionados = ordenados
                .Skip(Paginacion.Saltar(pagina, tamano))
                .Take(tamano)
                .Select(x => (x.Recurso, (double?)Math.Round(x.Distancia, 2)))
                .ToList();
        }
        else
        {
            total = await consulta.CountAsync(ct);
            var recursos = await consulta
                .OrderBy(v => v.Titulo)
                .ThenBy(v => v.IdRecurso)
                .Skip(Paginacion.Saltar(pagina, tamano))
                .Take(tamano)
                .ToListAsync(ct);

            seleccionados = recursos.Select(r => (r, (double?)null)).ToList();
        }

        var ids = seleccionados.Select(x => x.Recurso.IdRecurso).ToList();
        var categorias = await db.RecursoCategorias
            .AsNoTracking()
            .Where(rc => ids.Contains(rc.IdRecurso))
            .Select(rc => new { rc.IdRecurso, rc.Categoria.Nombre })
            .ToListAsync(ct);
        var categoriasPorRecurso = categorias
            .GroupBy(c => c.IdRecurso)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<string>)g.Select(c => c.Nombre).OrderBy(n => n).ToList());

        var items = seleccionados.Select(x => new RecursoExploradoDto(
            x.Recurso.IdRecurso,
            x.Recurso.Tipo,
            x.Recurso.Titulo,
            x.Recurso.Descripcion,
            x.Recurso.Localidad,
            x.Recurso.Municipio,
            x.Recurso.Latitud,
            x.Recurso.Longitud,
            categoriasPorRecurso.GetValueOrDefault(x.Recurso.IdRecurso, []),
            x.Recurso.ActualizadoEn,
            x.DistanciaKm)).ToList();

        return new PaginaResultado<RecursoExploradoDto>(items, total, pagina, tamano);
    }
}
