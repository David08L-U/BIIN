using Biin.Application.Consultas;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Interfaces;
using Biin.Application.Mappings;
using Biin.Application.Validators;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>Consulta pública de eventos por localidad, fecha, categoría o cercanía GPS, con su estado (RF06, CU-06, HU06).</summary>
public class EventosService(IAppDbContext db, IReloj reloj)
{
    public const double RadioPorDefectoKm = 25.0;

    public async Task<PaginaResultado<EventoResumenDto>> ListarAsync(
        FiltroEventosRequest filtro,
        CancellationToken ct = default)
    {
        if (filtro.Desde.HasValue && filtro.Hasta.HasValue && filtro.Hasta < filtro.Desde)
            throw new ReglaNegocioException("La fecha 'hasta' no puede ser anterior a 'desde'.");

        var usarProximidad = ValidacionGeografia.ValidarProximidadOpcional(
            filtro.Lat, filtro.Lng, filtro.RadioKm, RadioPorDefectoKm, out var lat, out var lng, out var radioKm);

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

        if (usarProximidad)
        {
            var candidatos = await consulta.ToListAsync(ct);
            var ordenados = candidatos
                .Select(e => (Evento: e, Distancia: CalculadoraTraslado.DistanciaKm(lat, lng, e.Ubicacion.Latitud, e.Ubicacion.Longitud)))
                .Where(x => x.Distancia <= radioKm)
                .OrderBy(x => x.Distancia)
                .ThenBy(x => x.Evento.Inicio)
                .ThenBy(x => x.Evento.IdRecurso)
                .ToList();

            var itemsCercanos = ordenados
                .Skip(Paginacion.Saltar(pagina, tamano))
                .Take(tamano)
                .Select(x => AResumen(x.Evento, Math.Round(x.Distancia, 2)))
                .ToList();

            return new PaginaResultado<EventoResumenDto>(itemsCercanos, ordenados.Count, pagina, tamano);
        }

        var total = await consulta.CountAsync(ct);
        var eventos = await consulta
            .OrderBy(e => e.Inicio)
            .ThenBy(e => e.IdRecurso)
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .ToListAsync(ct);

        return new PaginaResultado<EventoResumenDto>(eventos.Select(e => AResumen(e, null)).ToList(), total, pagina, tamano);
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

    private static EventoResumenDto AResumen(Evento e, double? distanciaKm) => new(
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
        e.Recurso.ActualizadoEn,
        distanciaKm);
}
