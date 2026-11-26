namespace Biin.Application.DTOs.Catalogos;

/// <summary>Categoría con cuántos contenidos publicados (negocios, eventos y lugares) tiene.</summary>
public record CategoriaDto(int IdCategoria, string Nombre, int TotalPublicados);

public record MunicipioDto(int IdMunicipio, string Codigo, string Nombre);

public record LocalidadDto(int IdLocalidad, string Nombre, int IdMunicipio, string Municipio);
