using System.Text.Json;

namespace Biin.Application.DTOs.Itinerarios;

public sealed record GuardarItinerarioRequest(string Destino, JsonElement Borrador, string? ZonaHoraria = null);

public sealed record ItinerarioDto(
    int IdItinerario,
    string Nombre,
    DateOnly Inicio,
    DateOnly Fin,
    DateTime GuardadoEn,
    string Destino,
    JsonElement Borrador);

/// <summary>Metadata no destructiva para filas históricas que no tienen borrador JSONB.</summary>
public sealed record ItinerarioAnteriorDto(
    int IdItinerario,
    string Nombre,
    DateOnly Inicio,
    DateOnly Fin,
    DateTime GuardadoEn,
    int ActividadesRegistradas);
