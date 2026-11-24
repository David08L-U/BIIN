using System.Text.Json;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;

namespace Biin.Application.Services;

/// <summary>Implementación de bitácora administrativa sobre <see cref="IAppDbContext"/> (paquete 17.1.5).</summary>
public class BitacoraAdminService(IAppDbContext db) : IBitacoraAdmin
{
    private static readonly JsonSerializerOptions OpcionesJson = new(JsonSerializerDefaults.Web);

    public void Registrar(int idUsuarioAdmin, string accion, string tabla, string idRegistro, object? detalle = null)
    {
        db.BitacoraAdmin.Add(new BitacoraAdmin
        {
            IdUsuario = idUsuarioAdmin,
            Accion = accion,
            Tabla = tabla,
            IdRegistro = idRegistro,
            Detalle = detalle is null ? null : JsonSerializer.Serialize(detalle, OpcionesJson),
            Fecha = DateTime.UtcNow
        });
    }
}
