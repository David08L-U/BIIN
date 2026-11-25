namespace Biin.Application.DTOs.Comun;

/// <summary>Página de resultados de un listado.</summary>
public record PaginaResultado<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Pagina,
    int Tamano);

/// <summary>Límites comunes de paginación para todos los listados.</summary>
public static class Paginacion
{
    public const int TamanoMaximo = 100;

    /// <summary>Página mínima 1 y tamaño entre 1 y <see cref="TamanoMaximo"/>.</summary>
    public static (int Pagina, int Tamano) Normalizar(int pagina, int tamano) =>
        (Math.Max(1, pagina), Math.Clamp(tamano, 1, TamanoMaximo));

    public static int Saltar(int pagina, int tamano) => (pagina - 1) * tamano;
}
