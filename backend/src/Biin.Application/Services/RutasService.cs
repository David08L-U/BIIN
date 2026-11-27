using Biin.Application.Consultas;
using Biin.Application.DTOs.Comun;
using Biin.Application.DTOs.Contenidos;
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

    public async Task<RutaDetalleDto> ObtenerDetalleAsync(
        int idRuta,
        short? diaSemana = null,
        CancellationToken ct = default)
    {
        if (idRuta <= 0)
            throw new ReglaNegocioException("El identificador de la ruta debe ser mayor a cero.");
        if (diaSemana is < 0 or > 6)
            throw new ReglaNegocioException("El día de la semana debe estar entre 0 (domingo) y 6 (sábado).");

        var ahoraUtc = reloj.AhoraUtc;
        var hoyLocal = DateOnly.FromDateTime(ZonaYucatan.ALocal(ahoraUtc));

        var ruta = await db.Rutas
            .AsNoTracking()
            .Include(r => r.Recurso)
                .ThenInclude(rec => rec.Fotografias)
            .Include(r => r.Paradas)
                .ThenInclude(p => p.Ubicacion)
                    .ThenInclude(u => u.Localidad)
                        .ThenInclude(l => l.Municipio)
            .Include(r => r.Puntos)
            .Include(r => r.Horarios)
            .Include(r => r.Tarifas)
            .SingleOrDefaultAsync(r =>
                r.IdRecurso == idRuta &&
                r.Activa &&
                r.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado, ct)
            ?? throw new NoEncontradoException("Ruta no encontrada.");

        var paradasOrdenadas = ruta.Paradas.OrderBy(p => p.Orden).ToList();
        var paradasDto = paradasOrdenadas.Select(p => new ParadaMapaDto(
            p.Orden,
            p.IdUbicacion,
            p.Ubicacion?.DireccionReferencia,
            p.Ubicacion?.Latitud ?? 0m,
            p.Ubicacion?.Longitud ?? 0m,
            p.Ubicacion?.IdLocalidad ?? 0,
            NombreLocalidad(p),
            p.Ubicacion?.Localidad?.IdMunicipio ?? 0,
            p.Ubicacion?.Localidad?.Municipio?.Nombre ?? string.Empty,
            p.PermiteAbordar,
            p.PermiteDescender)).ToList();

        var puntosDto = ruta.Puntos.Count > 0
            ? ruta.Puntos
                .OrderBy(pt => pt.Orden)
                .Select(pt => new PuntoMapaDto(pt.Orden, pt.Latitud, pt.Longitud))
                .ToList()
            : paradasDto
                .Select((p, idx) => new PuntoMapaDto(idx + 1, p.Latitud, p.Longitud))
                .ToList();

        var horariosDto = ruta.Horarios
            .Where(h => EsHorarioVigente(h, hoyLocal) && (!diaSemana.HasValue || h.DiaSemana == diaSemana.Value))
            .OrderBy(h => h.DiaSemana)
            .ThenBy(h => h.HoraSalida)
            .Select(h => new HorarioRutaDto(h.IdHorario, h.DiaSemana, h.HoraSalida, h.VigenteDesde, h.VigenteHasta))
            .ToList();

        var localidadesPorOrden = paradasOrdenadas.ToDictionary(p => p.Orden, NombreLocalidad);
        var tarifasDto = ruta.Tarifas
            .Where(t => t.EsVigente(hoyLocal))
            .OrderBy(t => t.OrdenOrigen)
            .ThenBy(t => t.OrdenDestino)
            .Select(t => new TarifaVigenteDto(
                t.IdTarifa,
                t.IdRuta,
                t.OrdenOrigen,
                localidadesPorOrden.GetValueOrDefault(t.OrdenOrigen, $"Parada {t.OrdenOrigen}"),
                t.OrdenDestino,
                localidadesPorOrden.GetValueOrDefault(t.OrdenDestino, $"Parada {t.OrdenDestino}"),
                t.Monto,
                t.VigenteDesde,
                t.VigenteHasta))
            .ToList();

        var fotosDto = ruta.Recurso.Fotografias
            .OrderBy(f => f.Orden)
            .Select(f => new FotografiaDto(f.IdFotografia, f.UrlArchivo, f.TextoAlternativo, f.Orden))
            .ToList();

        var regresoDto = await BuscarRutasRegresoAsync(ruta, paradasOrdenadas, hoyLocal, ct);
        var proximasSalidas = await CargarSalidasConCupoAsync(
            idRuta,
            desdeUtc: ahoraUtc,
            hastaUtcExclusivo: null,
            soloPendientesOEnCurso: true,
            limite: 10,
            ct);

        return new RutaDetalleDto(
            ruta.IdRecurso,
            ruta.Codigo,
            ruta.Recurso.Titulo,
            ruta.Recurso.Descripcion,
            ruta.Recurso.ActualizadoEn,
            TarifasService.NotaTarifaAproximada,
            fotosDto,
            paradasDto,
            puntosDto,
            horariosDto,
            tarifasDto,
            regresoDto,
            proximasSalidas);
    }

    public async Task<SalidasRutaResponse> ObtenerSalidasAsync(
        int idRuta,
        DateOnly? fecha = null,
        CancellationToken ct = default)
    {
        if (idRuta <= 0)
            throw new ReglaNegocioException("El identificador de la ruta debe ser mayor a cero.");

        var ruta = await db.Rutas
            .AsNoTracking()
            .Include(r => r.Recurso)
            .SingleOrDefaultAsync(r =>
                r.IdRecurso == idRuta &&
                r.Activa &&
                r.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado, ct)
            ?? throw new NoEncontradoException("Ruta no encontrada.");

        var fechaDia = fecha ?? DateOnly.FromDateTime(ZonaYucatan.ALocal(reloj.AhoraUtc));
        var inicioUtc = ZonaYucatan.InicioDelDiaUtc(fechaDia);
        var finUtc = ZonaYucatan.InicioDelDiaUtc(fechaDia.AddDays(1));

        var salidas = await CargarSalidasConCupoAsync(
            idRuta,
            desdeUtc: inicioUtc,
            hastaUtcExclusivo: finUtc,
            soloPendientesOEnCurso: false,
            limite: 100,
            ct);

        return new SalidasRutaResponse(ruta.IdRecurso, ruta.Codigo, ruta.Recurso.Titulo, fechaDia, salidas);
    }

    private async Task<IReadOnlyList<RutaRegresoDto>> BuscarRutasRegresoAsync(
        Ruta rutaIda,
        IReadOnlyList<RutaParada> paradasIda,
        DateOnly hoyLocal,
        CancellationToken ct)
    {
        if (paradasIda.Count < 2)
            return [];

        var idLocInicioIda = paradasIda[0].Ubicacion?.IdLocalidad;
        var idLocFinIda = paradasIda[^1].Ubicacion?.IdLocalidad;
        if (!idLocInicioIda.HasValue || !idLocFinIda.HasValue || idLocInicioIda == idLocFinIda)
            return [];

        var candidatas = await db.Rutas
            .AsNoTracking()
            .Include(r => r.Recurso)
            .Include(r => r.Paradas)
                .ThenInclude(p => p.Ubicacion)
                    .ThenInclude(u => u.Localidad)
            .Include(r => r.Tarifas)
            .Where(r => r.IdRecurso != rutaIda.IdRecurso &&
                        r.Activa &&
                        r.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado)
            .ToListAsync(ct);

        var resultado = new List<RutaRegresoDto>();
        foreach (var candidata in candidatas)
        {
            var paradas = candidata.Paradas.OrderBy(p => p.Orden).ToList();
            var paradaOrigenReg = paradas.FirstOrDefault(p =>
                p.PermiteAbordar && p.Ubicacion?.IdLocalidad == idLocFinIda.Value);
            if (paradaOrigenReg is null)
                continue;

            var paradaDestinoReg = paradas.FirstOrDefault(p =>
                p.Orden > paradaOrigenReg.Orden &&
                p.PermiteDescender &&
                p.Ubicacion?.IdLocalidad == idLocInicioIda.Value);
            if (paradaDestinoReg is null)
                continue;

            var tarifa = BuscarTarifaVigente(candidata.Tarifas, paradaOrigenReg.Orden, paradaDestinoReg.Orden, hoyLocal);
            resultado.Add(new RutaRegresoDto(
                candidata.IdRecurso,
                candidata.Codigo,
                candidata.Recurso.Titulo,
                NombreLocalidad(paradaOrigenReg),
                NombreLocalidad(paradaDestinoReg),
                tarifa?.Monto));
        }

        return resultado.OrderBy(r => r.Titulo).ThenBy(r => r.Codigo).ToList();
    }

    private async Task<IReadOnlyList<SalidaConCupoDto>> CargarSalidasConCupoAsync(
        int idRuta,
        DateTime desdeUtc,
        DateTime? hastaUtcExclusivo,
        bool soloPendientesOEnCurso,
        int limite,
        CancellationToken ct)
    {
        var consultaSalidas = db.Salidas
            .AsNoTracking()
            .Include(s => s.Unidad)
            .Where(s => s.IdRuta == idRuta && s.SalidaProgramada >= desdeUtc);

        if (hastaUtcExclusivo.HasValue)
            consultaSalidas = consultaSalidas.Where(s => s.SalidaProgramada < hastaUtcExclusivo.Value);

        if (soloPendientesOEnCurso)
            consultaSalidas = consultaSalidas.Where(s =>
                s.Estado != EstadoSalida.Cancelada && s.Estado != EstadoSalida.Finalizada);

        var salidas = await consultaSalidas
            .OrderBy(s => s.SalidaProgramada)
            .Take(limite)
            .ToListAsync(ct);

        if (salidas.Count == 0)
            return [];

        var idsSalida = salidas.Select(s => s.IdSalida).ToList();
        var cuposPorSalida = await db.VCupoVigente
            .AsNoTracking()
            .Where(v => idsSalida.Contains(v.IdSalida))
            .ToDictionaryAsync(v => v.IdSalida, ct);

        return salidas.Select(s =>
        {
            cuposPorSalida.TryGetValue(s.IdSalida, out var cupo);
            return new SalidaConCupoDto(
                s.IdSalida,
                s.IdRuta,
                s.Unidad?.Identificador ?? $"Unidad {s.IdUnidad}",
                s.SalidaProgramada,
                s.CapacidadHabilitada,
                s.Estado,
                cupo?.EstadoCupo ?? VCupoVigente.EstadoNoConfirmado,
                cupo?.AsientosDisponibles,
                cupo?.RegistradoEn,
                cupo?.ValidoHasta);
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
