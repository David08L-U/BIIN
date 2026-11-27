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

/// <summary>Consulta pública de lugares turísticos, culturales y para fotos (RF07, CU-07, HU07).</summary>
public class LugaresService(IAppDbContext db, IReloj reloj)
{
    public const double RadioPorDefectoKm = 25.0;

    public async Task<PaginaResultado<LugarResumenDto>> ListarAsync(
        FiltroLugaresRequest filtro,
        CancellationToken ct = default)
    {
        var usarProximidad = ValidacionGeografia.ValidarProximidadOpcional(
            filtro.Lat, filtro.Lng, filtro.RadioKm, RadioPorDefectoKm, out var lat, out var lng, out var radioKm);

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

        var ahoraLocal = ZonaYucatan.ALocal(reloj.AhoraUtc);

        if (usarProximidad)
        {
            var candidatos = await consulta.ToListAsync(ct);
            var ordenados = candidatos
                .Select(l => (Lugar: l, Distancia: CalculadoraTraslado.DistanciaKm(lat, lng, l.Ubicacion.Latitud, l.Ubicacion.Longitud)))
                .Where(x => x.Distancia <= radioKm)
                .OrderBy(x => x.Distancia)
                .ThenBy(x => x.Lugar.Recurso.Titulo)
                .ThenBy(x => x.Lugar.IdRecurso)
                .ToList();

            var itemsCercanos = ordenados
                .Skip(Paginacion.Saltar(pagina, tamano))
                .Take(tamano)
                .Select(x => AResumen(x.Lugar, ahoraLocal, Math.Round(x.Distancia, 2)))
                .ToList();

            return new PaginaResultado<LugarResumenDto>(itemsCercanos, ordenados.Count, pagina, tamano);
        }

        var total = await consulta.CountAsync(ct);
        var lugares = await consulta
            .OrderBy(l => l.Recurso.Titulo)
            .ThenBy(l => l.IdRecurso)
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .ToListAsync(ct);

        var items = lugares.Select(l => AResumen(l, ahoraLocal, null)).ToList();
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

    private static LugarResumenDto AResumen(Lugar l, DateTime ahoraLocal, double? distanciaKm) => new(
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
        l.Recurso.ActualizadoEn,
        distanciaKm);
}
