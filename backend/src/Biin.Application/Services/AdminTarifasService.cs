using Biin.Application.DTOs.Admin;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>
/// Administración de tarifas aproximadas por tramo de ruta con control de vigencias y bitácora (RF12, CU-12, 17.1.5).
/// </summary>
public class AdminTarifasService(IAppDbContext db, IReloj reloj, IBitacoraAdmin bitacora)
{
    public async Task<IReadOnlyList<TarifaAdminDto>> ListarPorRutaAsync(
        int idRuta,
        bool soloVigentes = false,
        CancellationToken ct = default)
    {
        var ruta = await CargarRutaConParadasAsync(idRuta, ct)
            ?? throw new NoEncontradoException("Ruta no encontrada.");

        var hoy = HoyYucatan();
        var consulta = db.Tarifas.AsNoTracking().Where(t => t.IdRuta == idRuta);
        if (soloVigentes)
            consulta = consulta.Where(t => t.VigenteDesde <= hoy && (t.VigenteHasta == null || t.VigenteHasta >= hoy));

        var filas = await consulta
            .OrderBy(t => t.OrdenOrigen)
            .ThenBy(t => t.OrdenDestino)
            .ThenByDescending(t => t.VigenteDesde)
            .ToListAsync(ct);

        var localidades = LocalidadesPorOrden(ruta);
        return filas.Select(t => Mapear(t, localidades, hoy)).ToList();
    }

    public async Task<TarifaAdminDto> CrearAsync(
        int idAdmin,
        int idRuta,
        CrearTarifaRequest req,
        CancellationToken ct = default)
    {
        if (req.OrdenOrigen <= 0 || req.OrdenDestino <= 0)
            throw new ReglaNegocioException("El orden de origen y destino debe ser mayor a cero.");
        if (req.OrdenDestino <= req.OrdenOrigen)
            throw new ReglaNegocioException("La parada de destino debe ser posterior a la parada de origen.");
        ValidarMontoYVigencia(req.Monto, req.VigenteDesde, req.VigenteHasta);

        var ruta = await CargarRutaConParadasAsync(idRuta, ct)
            ?? throw new NoEncontradoException("Ruta no encontrada.");

        var ordenes = ruta.Paradas.Select(p => p.Orden).ToHashSet();
        if (!ordenes.Contains(req.OrdenOrigen) || !ordenes.Contains(req.OrdenDestino))
            throw new ReglaNegocioException("Las paradas de origen y destino deben pertenecer a la ruta.");

        await ValidarSinSolapamientoAsync(idRuta, req.OrdenOrigen, req.OrdenDestino, req.VigenteDesde, req.VigenteHasta, null, ct);

        var tarifa = new Tarifa
        {
            IdRuta = idRuta,
            OrdenOrigen = req.OrdenOrigen,
            OrdenDestino = req.OrdenDestino,
            Monto = decimal.Round(req.Monto, 2),
            VigenteDesde = req.VigenteDesde,
            VigenteHasta = req.VigenteHasta
        };

        db.Tarifas.Add(tarifa);
        await db.SaveChangesAsync(ct);

        bitacora.Registrar(idAdmin, AccionesBitacora.Crear, "tarifas", tarifa.IdTarifa.ToString(), new
        {
            idRuta,
            tarifa.OrdenOrigen,
            tarifa.OrdenDestino,
            tarifa.Monto,
            tarifa.VigenteDesde,
            tarifa.VigenteHasta
        });
        await db.SaveChangesAsync(ct);

        return Mapear(tarifa, LocalidadesPorOrden(ruta), HoyYucatan());
    }

    public async Task<TarifaAdminDto> ActualizarAsync(
        int idAdmin,
        int idRuta,
        int idTarifa,
        ActualizarTarifaRequest req,
        CancellationToken ct = default)
    {
        ValidarMontoYVigencia(req.Monto, req.VigenteDesde, req.VigenteHasta);

        var ruta = await CargarRutaConParadasAsync(idRuta, ct)
            ?? throw new NoEncontradoException("Ruta no encontrada.");

        var tarifa = await db.Tarifas
            .SingleOrDefaultAsync(t => t.IdTarifa == idTarifa && t.IdRuta == idRuta, ct)
            ?? throw new NoEncontradoException("Tarifa no encontrada en esta ruta.");

        await ValidarSinSolapamientoAsync(
            idRuta, tarifa.OrdenOrigen, tarifa.OrdenDestino, req.VigenteDesde, req.VigenteHasta, idTarifa, ct);

        var anterior = new { tarifa.Monto, tarifa.VigenteDesde, tarifa.VigenteHasta };
        tarifa.Monto = decimal.Round(req.Monto, 2);
        tarifa.VigenteDesde = req.VigenteDesde;
        tarifa.VigenteHasta = req.VigenteHasta;

        bitacora.Registrar(idAdmin, AccionesBitacora.Editar, "tarifas", tarifa.IdTarifa.ToString(), new
        {
            idRuta,
            tarifa.OrdenOrigen,
            tarifa.OrdenDestino,
            anterior,
            nuevo = new { tarifa.Monto, tarifa.VigenteDesde, tarifa.VigenteHasta }
        });
        await db.SaveChangesAsync(ct);

        return Mapear(tarifa, LocalidadesPorOrden(ruta), HoyYucatan());
    }

    public async Task<TarifaAdminDto> CerrarVigenciaAsync(
        int idAdmin,
        int idRuta,
        int idTarifa,
        CerrarVigenciaTarifaRequest req,
        CancellationToken ct = default)
    {
        var ruta = await CargarRutaConParadasAsync(idRuta, ct)
            ?? throw new NoEncontradoException("Ruta no encontrada.");

        var tarifa = await db.Tarifas
            .SingleOrDefaultAsync(t => t.IdTarifa == idTarifa && t.IdRuta == idRuta, ct)
            ?? throw new NoEncontradoException("Tarifa no encontrada en esta ruta.");

        if (req.VigenteHasta < tarifa.VigenteDesde)
            throw new ReglaNegocioException("La fecha de cierre no puede ser anterior al inicio de vigencia.");

        await ValidarSinSolapamientoAsync(
            idRuta, tarifa.OrdenOrigen, tarifa.OrdenDestino, tarifa.VigenteDesde, req.VigenteHasta, idTarifa, ct);

        var anteriorHasta = tarifa.VigenteHasta;
        tarifa.VigenteHasta = req.VigenteHasta;

        bitacora.Registrar(idAdmin, AccionesBitacora.Archivar, "tarifas", tarifa.IdTarifa.ToString(), new
        {
            idRuta,
            tarifa.OrdenOrigen,
            tarifa.OrdenDestino,
            vigenteHastaAnterior = anteriorHasta,
            vigenteHastaNuevo = req.VigenteHasta
        });
        await db.SaveChangesAsync(ct);

        return Mapear(tarifa, LocalidadesPorOrden(ruta), HoyYucatan());
    }

    private DateOnly HoyYucatan() => DateOnly.FromDateTime(ZonaYucatan.ALocal(reloj.AhoraUtc));

    private Task<Ruta?> CargarRutaConParadasAsync(int idRuta, CancellationToken ct) =>
        db.Rutas
            .AsNoTracking()
            .Include(r => r.Paradas)
                .ThenInclude(p => p.Ubicacion)
                    .ThenInclude(u => u.Localidad)
            .SingleOrDefaultAsync(r => r.IdRecurso == idRuta, ct);

    private async Task ValidarSinSolapamientoAsync(
        int idRuta,
        int ordenOrigen,
        int ordenDestino,
        DateOnly desde,
        DateOnly? hasta,
        int? excluirIdTarifa,
        CancellationToken ct)
    {
        var existentes = await db.Tarifas
            .AsNoTracking()
            .Where(t => t.IdRuta == idRuta &&
                        t.OrdenOrigen == ordenOrigen &&
                        t.OrdenDestino == ordenDestino &&
                        (excluirIdTarifa == null || t.IdTarifa != excluirIdTarifa.Value))
            .ToListAsync(ct);

        var finNuevo = hasta ?? DateOnly.MaxValue;
        var hayConflicto = existentes.Any(e =>
        {
            var finExistente = e.VigenteHasta ?? DateOnly.MaxValue;
            return desde <= finExistente && e.VigenteDesde <= finNuevo;
        });

        if (hayConflicto)
            throw new ConflictoException(
                "Ya existe otra tarifa con vigencia superpuesta para el mismo tramo. Cierra la vigencia anterior antes de registrar una nueva.");
    }

    private static void ValidarMontoYVigencia(decimal monto, DateOnly desde, DateOnly? hasta)
    {
        if (monto < 0)
            throw new ReglaNegocioException("El monto de la tarifa no puede ser negativo.");
        if (hasta.HasValue && hasta.Value < desde)
            throw new ReglaNegocioException("La fecha final de vigencia no puede ser anterior a la fecha inicial.");
    }

    private static Dictionary<int, string> LocalidadesPorOrden(Ruta ruta) =>
        ruta.Paradas.ToDictionary(
            p => p.Orden,
            p => p.Ubicacion?.Localidad?.Nombre ?? $"Parada {p.Orden}");

    private static TarifaAdminDto Mapear(Tarifa t, Dictionary<int, string> localidades, DateOnly hoy) => new(
        t.IdTarifa,
        t.IdRuta,
        t.OrdenOrigen,
        localidades.GetValueOrDefault(t.OrdenOrigen, $"Parada {t.OrdenOrigen}"),
        t.OrdenDestino,
        localidades.GetValueOrDefault(t.OrdenDestino, $"Parada {t.OrdenDestino}"),
        t.Monto,
        t.VigenteDesde,
        t.VigenteHasta,
        t.EsVigente(hoy));
}
