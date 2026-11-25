using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Comun;
using Biin.Application.Interfaces;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>Consulta de la bitácora de cambios administrativos (paquete 17.1.5, CU-12).</summary>
public class BitacoraConsultaService(IAppDbContext db)
{
    private static readonly string[] AccionesValidas =
        [AccionesBitacora.Crear, AccionesBitacora.Editar, AccionesBitacora.Publicar, AccionesBitacora.Archivar, AccionesBitacora.Eliminar];

    public async Task<PaginaResultado<BitacoraDto>> ListarAsync(FiltroBitacoraRequest filtro, CancellationToken ct = default)
    {
        if (filtro.Desde.HasValue && filtro.Hasta.HasValue && filtro.Hasta < filtro.Desde)
            throw new ReglaNegocioException("La fecha 'hasta' no puede ser anterior a 'desde'.");

        var (pagina, tamano) = Paginacion.Normalizar(filtro.Pagina, filtro.Tamano);
        var consulta = db.BitacoraAdmin.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filtro.Tabla))
        {
            var tabla = filtro.Tabla.Trim().ToLowerInvariant();
            consulta = consulta.Where(b => b.Tabla == tabla);
        }

        if (!string.IsNullOrWhiteSpace(filtro.Accion))
        {
            var accion = filtro.Accion.Trim().ToLowerInvariant();
            if (!AccionesValidas.Contains(accion))
                throw new ReglaNegocioException($"Acción no válida. Usa: {string.Join(", ", AccionesValidas)}.");
            consulta = consulta.Where(b => b.Accion == accion);
        }

        if (filtro.IdUsuario.HasValue)
            consulta = consulta.Where(b => b.IdUsuario == filtro.IdUsuario.Value);

        if (filtro.Desde.HasValue)
        {
            var desde = ZonaYucatan.InicioDelDiaUtc(filtro.Desde.Value);
            consulta = consulta.Where(b => b.Fecha >= desde);
        }

        if (filtro.Hasta.HasValue)
        {
            var hasta = ZonaYucatan.InicioDelDiaUtc(filtro.Hasta.Value.AddDays(1));
            consulta = consulta.Where(b => b.Fecha < hasta);
        }

        var total = await consulta.CountAsync(ct);
        var items = await consulta
            .OrderByDescending(b => b.Fecha)
            .ThenByDescending(b => b.IdBitacora)
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .Select(b => new BitacoraDto(b.IdBitacora, b.IdUsuario, b.Usuario.Nombre, b.Accion, b.Tabla, b.IdRegistro, b.Detalle, b.Fecha))
            .ToListAsync(ct);

        return new PaginaResultado<BitacoraDto>(items, total, pagina, tamano);
    }
}
