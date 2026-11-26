using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Biin.Application.DTOs.Itinerarios;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>RF09/HU09: persiste borradores completos y limita cada operación a su propietario.</summary>
public sealed class ItinerarioService(IAppDbContext db)
{
    private const int MaximoJsonBytes = 256 * 1024;

    public async Task<IReadOnlyList<ItinerarioDto>> ListarAsync(int idUsuario, CancellationToken ct)
    {
        var registros = await db.Itinerarios.AsNoTracking()
            .Where(x => x.IdUsuario == idUsuario && x.Borrador != null)
            .OrderByDescending(x => x.FechaCreacion)
            .ToListAsync(ct);
        return registros.Select(Mapear).ToArray();
    }

    public async Task<IReadOnlyList<ItinerarioAnteriorDto>> ListarAnterioresAsync(int idUsuario, CancellationToken ct) =>
        await db.Itinerarios.AsNoTracking()
            .Where(x => x.IdUsuario == idUsuario && x.Borrador == null)
            .OrderByDescending(x => x.FechaCreacion)
            .Select(x => new ItinerarioAnteriorDto(
                x.IdItinerario, x.Nombre, x.Inicio, x.Fin, x.FechaCreacion, x.Actividades.Count))
            .ToArrayAsync(ct);

    public async Task<ItinerarioDto> ObtenerAsync(int idUsuario, int id, CancellationToken ct)
    {
        var registro = await db.Itinerarios.AsNoTracking()
            .SingleOrDefaultAsync(x => x.IdUsuario == idUsuario && x.IdItinerario == id && x.Borrador != null, ct)
            ?? throw new NoEncontradoException("No se encontró el itinerario en esta cuenta.");
        return Mapear(registro);
    }

    public async Task<(ItinerarioDto Itinerario, bool Creado)> CrearAsync(
        int idUsuario, GuardarItinerarioRequest request, CancellationToken ct)
    {
        var datos = Validar(request);
        using var borrador = datos.Json;
        var existente = await db.Itinerarios.AsNoTracking()
            .SingleOrDefaultAsync(x => x.IdUsuario == idUsuario && x.HuellaPlan == datos.Huella, ct);
        if (existente is not null) return (Mapear(existente), false);

        var entidad = new Itinerario
        {
            IdUsuario = idUsuario,
            Nombre = Nombre(request.Destino, datos.Modo),
            Inicio = datos.Inicio,
            Fin = datos.Fin,
            Borrador = borrador,
            HuellaPlan = datos.Huella
        };
        db.Itinerarios.Add(entidad);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // El índice único resuelve el doble envío concurrente; devuelve el mismo plan si ya ganó otra solicitud.
            var duplicado = await db.Itinerarios.AsNoTracking()
                .SingleOrDefaultAsync(x => x.IdUsuario == idUsuario && x.HuellaPlan == datos.Huella, ct);
            if (duplicado is null) throw;
            return (Mapear(duplicado), false);
        }
        return (Mapear(entidad), true);
    }

    public async Task<ItinerarioDto> ActualizarAsync(
        int idUsuario, int id, GuardarItinerarioRequest request, CancellationToken ct)
    {
        var entidad = await db.Itinerarios
            .SingleOrDefaultAsync(x => x.IdUsuario == idUsuario && x.IdItinerario == id && x.Borrador != null, ct)
            ?? throw new NoEncontradoException("No se encontró el itinerario en esta cuenta.");
        var datos = Validar(request);
        using var borrador = datos.Json;
        if (!StringComparer.Ordinal.Equals(DestinoDe(entidad.Borrador!), request.Destino))
            throw new ReglaNegocioException("No se puede cambiar el destino de un itinerario guardado.");

        var duplicado = await db.Itinerarios.AsNoTracking().AnyAsync(
            x => x.IdUsuario == idUsuario && x.IdItinerario != id && x.HuellaPlan == datos.Huella, ct);
        if (duplicado) throw new ConflictoException("Ya existe otro itinerario con la misma configuración.");

        entidad.Nombre = Nombre(request.Destino, datos.Modo);
        entidad.Inicio = datos.Inicio;
        entidad.Fin = datos.Fin;
        entidad.Borrador = borrador;
        entidad.HuellaPlan = datos.Huella;
        await db.SaveChangesAsync(ct);
        return Mapear(entidad);
    }

    public async Task EliminarAsync(int idUsuario, int id, CancellationToken ct)
    {
        var entidad = await db.Itinerarios
            .SingleOrDefaultAsync(x => x.IdUsuario == idUsuario && x.IdItinerario == id && x.Borrador != null, ct)
            ?? throw new NoEncontradoException("No se encontró el itinerario en esta cuenta.");
        db.Itinerarios.Remove(entidad);
        await db.SaveChangesAsync(ct);
    }

    private static DatosValidos Validar(GuardarItinerarioRequest request)
    {
        var destino = request.Destino?.ToLowerInvariant();
        if (destino is not ("izamal" or "valladolid" or "tekit" or "homun" or "ticul"))
            throw new ReglaNegocioException("El destino del itinerario no es válido.");
        var borrador = request.Borrador;
        if (borrador.ValueKind != JsonValueKind.Object || Encoding.UTF8.GetByteCount(borrador.GetRawText()) > MaximoJsonBytes)
            throw new ReglaNegocioException("El borrador del itinerario no es válido o excede el tamaño permitido.");
        if (borrador.TryGetProperty("destino", out var destinoEnBorrador) &&
            destinoEnBorrador.ValueKind == JsonValueKind.String &&
            !StringComparer.OrdinalIgnoreCase.Equals(destinoEnBorrador.GetString(), destino))
            throw new ReglaNegocioException("El destino no coincide con el borrador.");
        if (!borrador.TryGetProperty("generado", out var generado) || generado.ValueKind != JsonValueKind.True ||
            !borrador.TryGetProperty("modo", out var modoJson) || modoJson.ValueKind != JsonValueKind.String ||
            !borrador.TryGetProperty("configuracion", out var config) || config.ValueKind != JsonValueKind.Object ||
            !config.TryGetProperty("fecha", out var fechaJson) || fechaJson.ValueKind != JsonValueKind.String ||
            !DateOnly.TryParseExact(fechaJson.GetString(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var inicio) ||
            !borrador.TryGetProperty("seleccion", out var seleccion) || seleccion.ValueKind != JsonValueKind.Array)
            throw new ReglaNegocioException("Genera un itinerario válido con fecha y selección antes de guardarlo.");

        FechaItinerario.ValidarNoPasada(inicio, request.ZonaHoraria);

        var modo = modoJson.GetString()!;
        if (modo is not ("recomendado" or "personalizado"))
            throw new ReglaNegocioException("La modalidad del itinerario no es válida.");
        var estancia = config.TryGetProperty("estancia", out var estanciaJson) && estanciaJson.ValueKind == JsonValueKind.String
            ? estanciaJson.GetString()
            : null;
        var fin = estancia == "fin-de-semana" && (destino is "valladolid" or "homun") ? inicio.AddDays(1) : inicio;
        var normalizado = NormalizarJson(borrador);
        var json = JsonDocument.Parse(normalizado);
        var huella = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalizado))).ToLowerInvariant();
        return new DatosValidos(inicio, fin, modo, json, huella);
    }

    private static string NormalizarJson(JsonElement elemento)
    {
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream)) EscribirNormalizado(writer, elemento);
        return Encoding.UTF8.GetString(stream.ToArray());
    }

    private static void EscribirNormalizado(Utf8JsonWriter writer, JsonElement elemento)
    {
        switch (elemento.ValueKind)
        {
            case JsonValueKind.Object:
                writer.WriteStartObject();
                foreach (var propiedad in elemento.EnumerateObject().OrderBy(p => p.Name, StringComparer.Ordinal))
                {
                    writer.WritePropertyName(propiedad.Name);
                    EscribirNormalizado(writer, propiedad.Value);
                }
                writer.WriteEndObject();
                break;
            case JsonValueKind.Array:
                writer.WriteStartArray();
                foreach (var valor in elemento.EnumerateArray()) EscribirNormalizado(writer, valor);
                writer.WriteEndArray();
                break;
            default:
                elemento.WriteTo(writer);
                break;
        }
    }

    private static string Nombre(string destino, string modo)
    {
        var nombreDestino = destino switch { "homun" => "Homún", "izamal" => "Izamal", "valladolid" => "Valladolid", "tekit" => "Tekit", "ticul" => "Ticul", _ => destino };
        return $"{nombreDestino} · {(modo == "personalizado" ? "Personalizado" : "Recomendado")}";
    }

    private static string DestinoDe(JsonDocument documento) =>
        documento.RootElement.TryGetProperty("destino", out var destino) && destino.ValueKind == JsonValueKind.String
            ? destino.GetString() ?? "izamal"
            : "izamal";

    private static ItinerarioDto Mapear(Itinerario entidad)
    {
        using var borrador = JsonDocument.Parse(entidad.Borrador!.RootElement.GetRawText());
        return new ItinerarioDto(entidad.IdItinerario, entidad.Nombre, entidad.Inicio, entidad.Fin,
            DateTime.SpecifyKind(entidad.FechaCreacion, DateTimeKind.Utc), DestinoDe(entidad.Borrador), borrador.RootElement.Clone());
    }

    private sealed record DatosValidos(DateOnly Inicio, DateOnly Fin, string Modo, JsonDocument Json, string Huella);
}
