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

/// <summary>Consulta pública de negocios gastronómicos publicados (RF05, CU-05, HU05).</summary>
public class NegociosService(IAppDbContext db, IReloj reloj)
{
    public async Task<PaginaResultado<NegocioResumenDto>> ListarAsync(
        FiltroNegociosRequest filtro,
        CancellationToken ct = default)
    {
        var (pagina, tamano) = Paginacion.Normalizar(filtro.Pagina, filtro.Tamano);
        var consulta = ConsultaPublicados();

        if (filtro.IdLocalidad.HasValue)
            consulta = consulta.Where(n => n.Ubicacion.IdLocalidad == filtro.IdLocalidad.Value);

        if (filtro.IdMunicipio.HasValue)
            consulta = consulta.Where(n => n.Ubicacion.Localidad.IdMunicipio == filtro.IdMunicipio.Value);

        if (filtro.IdCategoria.HasValue)
            consulta = consulta.Where(n => n.Recurso.Categorias.Any(c => c.IdCategoria == filtro.IdCategoria.Value));

        if (filtro.PrecioMaximo.HasValue)
        {
            if (filtro.PrecioMaximo.Value < 0)
                throw new ReglaNegocioException("El precio máximo no puede ser negativo.");
            // Sin precio registrado no se descarta: el dato no está confirmado
            consulta = consulta.Where(n =>
                n.PrecioMinimoAprox == null || n.PrecioMinimoAprox <= filtro.PrecioMaximo.Value);
        }

        var texto = FuncionesBd.NormalizarTexto(filtro.Busqueda?.Trim());
        if (texto.Length > 0)
            consulta = consulta.Where(n =>
                FuncionesBd.Normalizar(n.Recurso.Titulo).Contains(texto) ||
                FuncionesBd.Normalizar(n.Recurso.Descripcion ?? string.Empty).Contains(texto) ||
                FuncionesBd.Normalizar(n.Ubicacion.Localidad.Nombre).Contains(texto));

        var total = await consulta.CountAsync(ct);
        var negocios = await consulta
            .OrderBy(n => n.Recurso.Titulo)
            .ThenBy(n => n.IdRecurso)
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .ToListAsync(ct);

        var ahoraLocal = ZonaYucatan.ALocal(reloj.AhoraUtc);
        var items = negocios.Select(n => AResumen(n, ahoraLocal)).ToList();
        return new PaginaResultado<NegocioResumenDto>(items, total, pagina, tamano);
    }

    public async Task<NegocioDetalleDto> ObtenerAsync(int idRecurso, CancellationToken ct = default)
    {
        var n = await ConsultaPublicados().SingleOrDefaultAsync(x => x.IdRecurso == idRecurso, ct)
            ?? throw new NoEncontradoException("Negocio no encontrado.");

        var ahoraLocal = ZonaYucatan.ALocal(reloj.AhoraUtc);
        return new NegocioDetalleDto(
            n.IdRecurso,
            n.Recurso.Titulo,
            n.Recurso.Descripcion,
            n.Telefono,
            n.PrecioMinimoAprox,
            n.PrecioMaximoAprox,
            ContenidosMapeo.AUbicacionDto(n.Ubicacion),
            ContenidosMapeo.Categorias(n.Recurso),
            ContenidosMapeo.Fotografias(n.Recurso),
            ContenidosMapeo.Horarios(n.Recurso),
            ContenidosMapeo.AbiertoAhora(n.Recurso, ahoraLocal),
            n.Recurso.ActualizadoEn);
    }

    /// <summary>Solo negocios publicados, con todo lo necesario para armar los DTOs.</summary>
    private IQueryable<Negocio> ConsultaPublicados() =>
        db.Negocios
            .AsNoTracking()
            .Include(n => n.Recurso).ThenInclude(r => r.Categorias).ThenInclude(rc => rc.Categoria)
            .Include(n => n.Recurso).ThenInclude(r => r.Fotografias)
            .Include(n => n.Recurso).ThenInclude(r => r.HorariosVisita)
            .Include(n => n.Ubicacion).ThenInclude(u => u.Localidad).ThenInclude(l => l.Municipio)
            .Where(n => n.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado);

    private static NegocioResumenDto AResumen(Negocio n, DateTime ahoraLocal) => new(
        n.IdRecurso,
        n.Recurso.Titulo,
        n.Recurso.Descripcion,
        n.Ubicacion.Localidad.Nombre,
        n.Ubicacion.Localidad.Municipio.Nombre,
        n.Ubicacion.Latitud,
        n.Ubicacion.Longitud,
        n.PrecioMinimoAprox,
        n.PrecioMaximoAprox,
        ContenidosMapeo.NombresCategorias(n.Recurso),
        ContenidosMapeo.FotoPrincipal(n.Recurso),
        ContenidosMapeo.AbiertoAhora(n.Recurso, ahoraLocal),
        n.Recurso.ActualizadoEn);
}
