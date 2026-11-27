using Biin.Application.Consultas;
using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Catalogos;
using Biin.Application.DTOs.Contenidos;
using Biin.Application.Interfaces;
using Biin.Application.Mappings;
using Biin.Application.Validators;
using Biin.Domain.Entities;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>
/// Registro de localidades y ubicaciones que necesitan los contenidos (CU-12). Los municipios son
/// catálogo oficial (INEGI) y se cargan por SQL, no desde la API.
/// </summary>
public class AdminGeografiaService(IAppDbContext db, IBitacoraAdmin bitacora)
{
    public async Task<LocalidadDto> CrearLocalidadAsync(int idAdmin, CrearLocalidadRequest req, CancellationToken ct = default)
    {
        var nombre = (req.Nombre ?? string.Empty).Trim();
        if (nombre.Length is < 2 or > 120)
            throw new ReglaNegocioException("El nombre debe tener entre 2 y 120 caracteres.");

        var municipio = await db.Municipios.SingleOrDefaultAsync(m => m.IdMunicipio == req.IdMunicipio, ct)
            ?? throw new ReglaNegocioException("El municipio indicado no existe.");

        // UNIQUE (id_municipio, nombre): se compara sin acentos ni mayúsculas para no duplicar "Homun" y "Homún"
        var normalizado = FuncionesBd.NormalizarTexto(nombre);
        if (await db.Localidades.AnyAsync(l => l.IdMunicipio == req.IdMunicipio && FuncionesBd.Normalizar(l.Nombre) == normalizado, ct))
            throw new ConflictoException($"Ya existe la localidad «{nombre}» en {municipio.Nombre}.");

        var localidad = new Localidad { IdMunicipio = municipio.IdMunicipio, Municipio = municipio, Nombre = nombre };
        db.Localidades.Add(localidad);
        await db.SaveChangesAsync(ct);

        bitacora.Registrar(idAdmin, AccionesBitacora.Crear, "localidades", localidad.IdLocalidad.ToString(),
            new { nombre, municipio = municipio.Nombre });
        await db.SaveChangesAsync(ct);

        return new LocalidadDto(localidad.IdLocalidad, localidad.Nombre, municipio.IdMunicipio, municipio.Nombre);
    }

    public async Task<UbicacionDto> CrearUbicacionAsync(int idAdmin, CrearUbicacionRequest req, CancellationToken ct = default)
    {
        var (latitud, longitud) = ValidacionGeografia.ValidarEnYucatan(req.Latitud, req.Longitud);

        var localidad = await db.Localidades
            .Include(l => l.Municipio)
            .SingleOrDefaultAsync(l => l.IdLocalidad == req.IdLocalidad, ct)
            ?? throw new ReglaNegocioException("La localidad indicada no existe.");

        var ubicacion = new Ubicacion
        {
            IdLocalidad = localidad.IdLocalidad,
            Localidad = localidad,
            DireccionReferencia = string.IsNullOrWhiteSpace(req.DireccionReferencia) ? null : req.DireccionReferencia.Trim(),
            // numeric(9, 6) en la base
            Latitud = latitud,
            Longitud = longitud
        };
        db.Ubicaciones.Add(ubicacion);
        await db.SaveChangesAsync(ct);

        bitacora.Registrar(idAdmin, AccionesBitacora.Crear, "ubicaciones", ubicacion.IdUbicacion.ToString(),
            new { localidad = localidad.Nombre, ubicacion.Latitud, ubicacion.Longitud });
        await db.SaveChangesAsync(ct);

        return ContenidosMapeo.AUbicacionDto(ubicacion);
    }

    /// <summary>Ubicaciones de una localidad, para elegir dónde registrar un contenido.</summary>
    public async Task<IReadOnlyList<UbicacionDto>> ListarUbicacionesAsync(int idLocalidad, CancellationToken ct = default)
    {
        var ubicaciones = await db.Ubicaciones
            .AsNoTracking()
            .Include(u => u.Localidad).ThenInclude(l => l.Municipio)
            .Where(u => u.IdLocalidad == idLocalidad)
            .OrderBy(u => u.DireccionReferencia)
            .ThenBy(u => u.IdUbicacion)
            .ToListAsync(ct);
        return ubicaciones.Select(ContenidosMapeo.AUbicacionDto).ToList();
    }
}
