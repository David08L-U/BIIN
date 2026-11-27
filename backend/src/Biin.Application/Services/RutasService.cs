using Biin.Application.Consultas;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Transporte;
using Biin.Application.Interfaces;
using Biin.Application.Validators;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.Domain.Vistas;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>
/// Consulta pública de rutas de combis intermunicipales: búsqueda origen→destino respetando orden de paradas
/// y rutas cercanas por GPS consentido (RF02, CU-02, RNF05, paquete 10.1.7).
/// </summary>
public class RutasService(IAppDbContext db, IReloj reloj)
{
    public async Task<PaginaResultado<RutaResumenDto>> BuscarAsync(
        FiltroRutasRequest filtro,
        CancellationToken ct = default)
    {
        if (filtro.DiaSemana is < 0 or > 6)
            throw new ReglaNegocioException("El día de la semana debe estar entre 0 (domingo) y 6 (sábado).");

        var (pagina, tamano) = Paginacion.Normalizar(filtro.Pagina, filtro.Tamano);
        var ahoraUtc = reloj.AhoraUtc;
        var hoyLocal = DateOnly.FromDateTime(ZonaYucatan.ALocal(ahoraUtc));

        var rutasActivas = await db.Rutas
            .AsNoTracking()
            .Include(r => r.Recurso)
                .ThenInclude(rec => rec.Fotografias)
            .Include(r => r.Paradas)
                .ThenInclude(p => p.Ubicacion)
                    .ThenInclude(u => u.Localidad)
                        .ThenInclude(l => l.Municipio)
            .Include(r => r.Horarios)
            .Include(r => r.Tarifas)
            .Where(r => r.Activa && r.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado)
            .ToListAsync(ct);

        var textoBusqueda = FuncionesBd.NormalizarTexto(filtro.Busqueda?.Trim());
        var textoOrigen = FuncionesBd.NormalizarTexto(filtro.Origen?.Trim());
        var textoDestino = FuncionesBd.NormalizarTexto(filtro.Destino?.Trim());

        var tieneFiltroOrigen = filtro.IdLocalidadOrigen.HasValue || filtro.IdMunicipioOrigen.HasValue || textoOrigen.Length > 0;
        var tieneFiltroDestino = filtro.IdLocalidadDestino.HasValue || filtro.IdMunicipioDestino.HasValue || textoDestino.Length > 0;

        var coincidencias = new List<(Ruta Ruta, RutaParada ParadaOrigen, RutaParada ParadaDestino)>();

        foreach (var ruta in rutasActivas)
        {
            var paradas = ruta.Paradas.OrderBy(p => p.Orden).ToList();
            if (paradas.Count < 2)
                continue;

            if (textoBusqueda.Length > 0 && !CoincideTextoRuta(ruta, textoBusqueda))
                continue;

            if (filtro.DiaSemana.HasValue)
            {
                var operaEseDia = ruta.Horarios.Any(h =>
                    h.DiaSemana == filtro.DiaSemana.Value &&
                    EsHorarioVigente(h, hoyLocal));
                if (!operaEseDia)
                    continue;
            }

            if (!IntentarEmparejarTramo(
                paradas,
                tieneFiltroOrigen, filtro.IdLocalidadOrigen, filtro.IdMunicipioOrigen, textoOrigen,
                tieneFiltroDestino, filtro.IdLocalidadDestino, filtro.IdMunicipioDestino, textoDestino,
                out var origen, out var destino))
                continue;

            coincidencias.Add((ruta, origen!, destino!));
        }

        var ordenadas = coincidencias
            .OrderBy(x => x.Ruta.Recurso.Titulo)
            .ThenBy(x => x.Ruta.Codigo)
            .ToList();

        var total = ordenadas.Count;
        var paginaActual = ordenadas
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .ToList();

        var idsRutas = paginaActual.Select(x => x.Ruta.IdRecurso).ToList();
        var proximasPorRuta = await CargarProximaSalidaPorRutaAsync(idsRutas, ahoraUtc, ct);

        var items = paginaActual.Select(x =>
        {
            var tarifa = BuscarTarifaVigente(x.Ruta.Tarifas, x.ParadaOrigen.Orden, x.ParadaDestino.Orden, hoyLocal);
            proximasPorRuta.TryGetValue(x.Ruta.IdRecurso, out var proxima);
            var foto = x.Ruta.Recurso.Fotografias
                .OrderBy(f => f.Orden)
                .Select(f => f.UrlArchivo)
                .FirstOrDefault();

            return new RutaResumenDto(
                x.Ruta.IdRecurso,
                x.Ruta.Codigo,
                x.Ruta.Recurso.Titulo,
                x.Ruta.Recurso.Descripcion,
                NombreLocalidad(x.ParadaOrigen),
                NombreLocalidad(x.ParadaDestino),
                x.Ruta.Paradas.Count,
                tarifa?.Monto,
                proxima?.SalidaProgramada,
                proxima?.EstadoCupo ?? VCupoVigente.EstadoNoConfirmado,
                proxima?.AsientosDisponibles,
                foto,
                x.Ruta.Recurso.ActualizadoEn);
        }).ToList();

        return new PaginaResultado<RutaResumenDto>(items, total, pagina, tamano);
    }

    public async Task<IReadOnlyList<RutaCercanaDto>> BuscarCercanasAsync(
        FiltroRutasCercanasRequest filtro,
        CancellationToken ct = default)
    {
        var (lat, lng) = ValidacionGeografia.ValidarGlobales(filtro.Lat, filtro.Lng);
        var radioKm = ValidacionGeografia.ValidarRadioKm(filtro.RadioKm);
        var limite = Math.Clamp(filtro.Limite, 1, 50);
        var hoyLocal = DateOnly.FromDateTime(ZonaYucatan.ALocal(reloj.AhoraUtc));

        var paradasAbordaje = await db.VParadasRuta
            .AsNoTracking()
            .Where(p => p.PermiteAbordar)
            .ToListAsync(ct);

        var mejorParadaPorRuta = paradasAbordaje
            .Select(p => (Parada: p, Distancia: CalculadoraTraslado.DistanciaKm(lat, lng, p.Latitud, p.Longitud)))
            .Where(x => x.Distancia <= radioKm)
            .GroupBy(x => x.Parada.IdRuta)
            .Select(g => g.OrderBy(x => x.Distancia).ThenBy(x => x.Parada.Orden).First())
            .OrderBy(x => x.Distancia)
            .ThenBy(x => x.Parada.Codigo)
            .Take(limite)
            .ToList();

        if (mejorParadaPorRuta.Count == 0)
            return [];

        var idsRutas = mejorParadaPorRuta.Select(x => x.Parada.IdRuta).ToList();
        var rutas = await db.Rutas
            .AsNoTracking()
            .Include(r => r.Recurso)
            .Include(r => r.Paradas)
                .ThenInclude(p => p.Ubicacion)
                    .ThenInclude(u => u.Localidad)
            .Include(r => r.Tarifas)
            .Where(r => idsRutas.Contains(r.IdRecurso))
            .ToDictionaryAsync(r => r.IdRecurso, ct);

        return mejorParadaPorRuta.Select(x =>
        {
            rutas.TryGetValue(x.Parada.IdRuta, out var ruta);
            var ultimaParada = ruta?.Paradas.OrderBy(p => p.Orden).LastOrDefault();
            var destinoFinal = ultimaParada is not null ? NombreLocalidad(ultimaParada) : x.Parada.Localidad;
            var tarifa = ruta is not null && ultimaParada is not null && ultimaParada.Orden > x.Parada.Orden
                ? BuscarTarifaVigente(ruta.Tarifas, x.Parada.Orden, ultimaParada.Orden, hoyLocal)
                : null;

            return new RutaCercanaDto(
                x.Parada.IdRuta,
                x.Parada.Codigo,
                x.Parada.Ruta,
                destinoFinal,
                x.Parada.Orden,
                x.Parada.Localidad,
                x.Parada.DireccionReferencia,
                x.Parada.Latitud,
                x.Parada.Longitud,
                Math.Round(x.Distancia, 2),
                CalculadoraTraslado.MinutosEstimados(x.Distancia),
                tarifa?.Monto,
                ruta?.Recurso.ActualizadoEn ?? reloj.AhoraUtc);
        }).ToList();
    }

    private async Task<Dictionary<int, VCupoVigente>> CargarProximaSalidaPorRutaAsync(
        IReadOnlyList<int> idsRutas,
        DateTime ahoraUtc,
        CancellationToken ct)
    {
        if (idsRutas.Count == 0)
            return [];

        var salidas = await db.VCupoVigente
            .AsNoTracking()
            .Where(v => idsRutas.Contains(v.IdRuta) &&
                        v.SalidaProgramada >= ahoraUtc &&
                        v.EstadoSalida != EstadoSalida.Cancelada &&
                        v.EstadoSalida != EstadoSalida.Finalizada)
            .OrderBy(v => v.SalidaProgramada)
            .ToListAsync(ct);

        return salidas
            .GroupBy(v => v.IdRuta)
            .ToDictionary(g => g.Key, g => g.First());
    }

    private static bool CoincideTextoRuta(Ruta ruta, string textoNormalizado) =>
        FuncionesBd.NormalizarTexto(ruta.Recurso.Titulo).Contains(textoNormalizado) ||
        FuncionesBd.NormalizarTexto(ruta.Codigo).Contains(textoNormalizado) ||
        FuncionesBd.NormalizarTexto(ruta.Recurso.Descripcion).Contains(textoNormalizado);

    private static bool EsHorarioVigente(HorarioRuta h, DateOnly fecha) =>
        h.VigenteDesde <= fecha && (h.VigenteHasta is null || h.VigenteHasta >= fecha);

    private static Tarifa? BuscarTarifaVigente(IEnumerable<Tarifa> tarifas, int ordenOrigen, int ordenDestino, DateOnly fecha) =>
        tarifas.FirstOrDefault(t =>
            t.OrdenOrigen == ordenOrigen &&
            t.OrdenDestino == ordenDestino &&
            t.EsVigente(fecha));

    private static bool IntentarEmparejarTramo(
        IReadOnlyList<RutaParada> paradasOrdenadas,
        bool tieneFiltroOrigen, int? idLocOrigen, int? idMunOrigen, string textoOrigen,
        bool tieneFiltroDestino, int? idLocDestino, int? idMunDestino, string textoDestino,
        out RutaParada? paradaOrigen,
        out RutaParada? paradaDestino)
    {
        paradaOrigen = null;
        paradaDestino = null;

        var candidatasOrigen = tieneFiltroOrigen
            ? paradasOrdenadas.Where(p => p.PermiteAbordar && CoincideParada(p, idLocOrigen, idMunOrigen, textoOrigen)).ToList()
            : [paradasOrdenadas[0]];

        var candidatasDestino = tieneFiltroDestino
            ? paradasOrdenadas.Where(p => p.PermiteDescender && CoincideParada(p, idLocDestino, idMunDestino, textoDestino)).ToList()
            : [paradasOrdenadas[^1]];

        foreach (var o in candidatasOrigen)
        {
            var d = candidatasDestino.FirstOrDefault(dest => dest.Orden > o.Orden);
            if (d is not null)
            {
                paradaOrigen = o;
                paradaDestino = d;
                return true;
            }
        }

        return false;
    }

    private static bool CoincideParada(RutaParada parada, int? idLocalidad, int? idMunicipio, string textoNormalizado)
    {
        var loc = parada.Ubicacion?.Localidad;
        if (loc is null)
            return false;

        if (idLocalidad.HasValue && loc.IdLocalidad != idLocalidad.Value)
            return false;

        if (idMunicipio.HasValue && loc.IdMunicipio != idMunicipio.Value)
            return false;

        if (textoNormalizado.Length > 0)
        {
            var enLocalidad = FuncionesBd.NormalizarTexto(loc.Nombre).Contains(textoNormalizado);
            var enMunicipio = loc.Municipio is not null && FuncionesBd.NormalizarTexto(loc.Municipio.Nombre).Contains(textoNormalizado);
            if (!enLocalidad && !enMunicipio)
                return false;
        }

        return true;
    }

    private static string NombreLocalidad(RutaParada parada) =>
        parada.Ubicacion?.Localidad?.Nombre ?? $"Parada {parada.Orden}";
}
