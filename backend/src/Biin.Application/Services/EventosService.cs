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

/// <summary>Consulta pública de eventos por localidad, fecha o categoría, con su estado (RF06, CU-06, HU06).</summary>
public class EventosService(IAppDbContext db, IReloj reloj)
{
    public async Task<PaginaResultado<EventoResumenDto>> ListarAsync(
        FiltroEventosRequest filtro,
        CancellationToken ct = default)
    {
        if (filtro.Desde.HasValue && filtro.Hasta.HasValue && filtro.Hasta < filtro.Desde)
            throw new ReglaNegocioException("La fecha 'hasta' no puede ser anterior a 'desde'.");

        var (pagina, tamano) = Paginacion.Normalizar(filtro.Pagina, filtro.Tamano);
        var consulta = ConsultaPublicados();

        // Sin fecha inicial se muestran los eventos que todavía no terminan
        var desdeUtc = filtro.Desde.HasValue ? ZonaYucatan.InicioDelDiaUtc(filtro.Desde.Value) : reloj.AhoraUtc;
        consulta = consulta.Where(e => e.Fin >= desdeUtc);

        if (filtro.Hasta.HasValue)
        {
            var hastaUtc = ZonaYucatan.InicioDelDiaUtc(filtro.Hasta.Value.AddDays(1));
            consulta = consulta.Where(e => e.Inicio < hastaUtc);
        }

        if (filtro.Estado.HasValue)
            consulta = consulta.Where(e => e.EstadoEvento == filtro.Estado.Value);

        if (filtro.IdLocalidad.HasValue)
            consulta = consulta.Where(e => e.Ubicacion.IdLocalidad == filtro.IdLocalidad.Value);

        if (filtro.IdMunicipio.HasValue)
            consulta = consulta.Where(e => e.Ubicacion.Localidad.IdMunicipio == filtro.IdMunicipio.Value);

        if (filtro.IdCategoria.HasValue)
            consulta = consulta.Where(e => e.Recurso.Categorias.Any(c => c.IdCategoria == filtro.IdCategoria.Value));

        var texto = FuncionesBd.NormalizarTexto(filtro.Busqueda?.Trim());
        if (texto.Length > 0)
            consulta = consulta.Where(e =>
                FuncionesBd.Normalizar(e.Recurso.Titulo).Contains(texto) ||
                FuncionesBd.Normalizar(e.Recurso.Descripcion ?? string.Empty).Contains(texto) ||
                FuncionesBd.Normalizar(e.Ubicacion.Localidad.Nombre).Contains(texto));

        var total = await consulta.CountAsync(ct);
        var eventos = await consulta
            .OrderBy(e => e.Inicio)
            .ThenBy(e => e.IdRecurso)
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .ToListAsync(ct);

        return new PaginaResultado<EventoResumenDto>(eventos.Select(AResumen).ToList(), total, pagina, tamano);
    }

    /// <summary>Ficha de un evento publicado, aunque ya haya pasado o esté cancelado.</summary>
    public async Task<EventoDetalleDto> ObtenerAsync(int idRecurso, CancellationToken ct = default)
    {
        var e = await ConsultaPublicados().SingleOrDefaultAsync(x => x.IdRecurso == idRecurso, ct)
            ?? throw new NoEncontradoException("Evento no encontrado.");

        return new EventoDetalleDto(
            e.IdRecurso,
            e.Recurso.Titulo,
            e.Recurso.Descripcion,
            e.Inicio,
            e.Fin,
            e.CostoEntrada,
            e.EstadoEvento,
            e.ContactoOrganizador,
            ContenidosMapeo.AUbicacionDto(e.Ubicacion),
            ContenidosMapeo.Categorias(e.Recurso),
            ContenidosMapeo.Fotografias(e.Recurso),
            e.Recurso.ActualizadoEn);
    }

    private IQueryable<Evento> ConsultaPublicados() =>
        db.Eventos
            .AsNoTracking()
            .Include(e => e.Recurso).ThenInclude(r => r.Categorias).ThenInclude(rc => rc.Categoria)
            .Include(e => e.Recurso).ThenInclude(r => r.Fotografias)
            .Include(e => e.Ubicacion).ThenInclude(u => u.Localidad).ThenInclude(l => l.Municipio)
            .Where(e => e.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado);

    private static EventoResumenDto AResumen(Evento e) => new(
        e.IdRecurso,
        e.Recurso.Titulo,
        e.Recurso.Descripcion,
        e.Inicio,
        e.Fin,
        e.CostoEntrada,
        e.EstadoEvento,
        e.Ubicacion.Localidad.Nombre,
        e.Ubicacion.Localidad.Municipio.Nombre,
        e.Ubicacion.Latitud,
        e.Ubicacion.Longitud,
        ContenidosMapeo.NombresCategorias(e.Recurso),
        ContenidosMapeo.FotoPrincipal(e.Recurso),
        e.Recurso.ActualizadoEn);
}
