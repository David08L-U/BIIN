using System.Text.Json;

namespace Biin.Application.DTOs.Itinerarios;

public sealed record GuardarItinerarioRequest(string Destino, JsonElement Borrador);

public sealed record ItinerarioDto(
    int IdItinerario,
    string Nombre,
    DateOnly Inicio,
    DateOnly Fin,
    DateTime GuardadoEn,
    string Destino,
    JsonElement Borrador);
