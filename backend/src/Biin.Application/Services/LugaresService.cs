using Biin.Application.Consultas;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Interfaces;
using Biin.Application.Mappings;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>Consulta pública de lugares turísticos, culturales y para fotos (RF07, CU-07, HU07).</summary>
public class LugaresService(IAppDbContext db, IReloj reloj)
{
    public async Task<PaginaResultado<LugarResumenDto>> ListarAsync(
        FiltroLugaresRequest filtro,
        CancellationToken ct = default)
    {
        var (pagina, tamano) = Paginacion.Normalizar(filtro.Pagina, filtro.Tamano);
        var consulta = ConsultaPublicados();

        if (filtro.IdLocalidad.HasValue)
            consulta = consulta.Where(l => l.Ubicacion.IdLocalidad == filtro.IdLocalidad.Value);

        if (filtro.IdMunicipio.HasValue)
            consulta = consulta.Where(l => l.Ubicacion.Localidad.IdMunicipio == filtro.IdMunicipio.Value);

        if (filtro.IdCategoria.HasValue)
            consulta = consulta.Where(l => l.Recurso.Categorias.Any(c => c.IdCategoria == filtro.IdCategoria.Value));

        if (filtro.CostoMaximo.HasValue)
        {
            if (filtro.CostoMaximo.Value < 0)
                throw new ReglaNegocioException("El costo máximo no puede ser negativo.");
            // Sin costo registrado se considera dato no confirmado y no se descarta
            consulta = consulta.Where(l => l.CostoAcceso == null || l.CostoAcceso <= filtro.CostoMaximo.Value);
        }

        var texto = FuncionesBd.NormalizarTexto(filtro.Busqueda?.Trim());
        if (texto.Length > 0)
            consulta = consulta.Where(l =>
                FuncionesBd.Normalizar(l.Recurso.Titulo).Contains(texto) ||
                FuncionesBd.Normalizar(l.Recurso.Descripcion ?? string.Empty).Contains(texto) ||
                FuncionesBd.Normalizar(l.Ubicacion.Localidad.Nombre).Contains(texto));

        var total = await consulta.CountAsync(ct);
        var lugares = await consulta
            .OrderBy(l => l.Recurso.Titulo)
            .ThenBy(l => l.IdRecurso)
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .ToListAsync(ct);

        var ahoraLocal = ZonaYucatan.ALocal(reloj.AhoraUtc);
        var items = lugares.Select(l => new LugarResumenDto(
            l.IdRecurso,
            l.Recurso.Titulo,
            l.Recurso.Descripcion,
            l.Ubicacion.Localidad.Nombre,
            l.Ubicacion.Localidad.Municipio.Nombre,
            l.Ubicacion.Latitud,
            l.Ubicacion.Longitud,
            l.CostoAcceso,
            ContenidosMapeo.NombresCategorias(l.Recurso),
            ContenidosMapeo.FotoPrincipal(l.Recurso),
            ContenidosMapeo.AbiertoAhora(l.Recurso, ahoraLocal),
            l.Recurso.ActualizadoEn)).ToList();

        return new PaginaResultado<LugarResumenDto>(items, total, pagina, tamano);
    }

    public async Task<LugarDetalleDto> ObtenerAsync(int idRecurso, CancellationToken ct = default)
    {
        var l = await ConsultaPublicados().SingleOrDefaultAsync(x => x.IdRecurso == idRecurso, ct)
            ?? throw new NoEncontradoException("Lugar no encontrado.");

        return new LugarDetalleDto(
            l.IdRecurso,
            l.Recurso.Titulo,
            l.Recurso.Descripcion,
            l.CostoAcceso,
            l.CondicionesAcceso,
            ContenidosMapeo.AUbicacionDto(l.Ubicacion),
            ContenidosMapeo.Categorias(l.Recurso),
            ContenidosMapeo.Fotografias(l.Recurso),
            ContenidosMapeo.Horarios(l.Recurso),
            ContenidosMapeo.AbiertoAhora(l.Recurso, ZonaYucatan.ALocal(reloj.AhoraUtc)),
            l.Recurso.ActualizadoEn);
    }

    private IQueryable<Lugar> ConsultaPublicados() =>
        db.Lugares
            .AsNoTracking()
            .Include(l => l.Recurso).ThenInclude(r => r.Categorias).ThenInclude(rc => rc.Categoria)
            .Include(l => l.Recurso).ThenInclude(r => r.Fotografias)
            .Include(l => l.Recurso).ThenInclude(r => r.HorariosVisita)
            .Include(l => l.Ubicacion).ThenInclude(u => u.Localidad).ThenInclude(m => m.Municipio)
            .Where(l => l.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado);
}
