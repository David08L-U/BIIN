namespace Biin.Domain.Entities;

/// <summary>
/// Estimación del traslado entre dos puntos de un itinerario (RF09). Usa la distancia en línea recta
/// (fórmula de haversine) corregida por un factor de carretera y una velocidad promedio de combi.
/// Es solo una referencia: no sustituye horarios ni recorridos reales de transporte.
/// </summary>
public static class CalculadoraTraslado
{
    public const double RadioTierraKm = 6371.0;

    /// <summary>Las carreteras no van en línea recta: se alarga la distancia un 30 %.</summary>
    public const double FactorCarretera = 1.3;

    /// <summary>Velocidad promedio estimada de una combi intermunicipal, con paradas.</summary>
    public const double VelocidadPromedioKmH = 40.0;

    /// <summary>Por debajo de esta distancia se considera que es el mismo sitio o se llega caminando.</summary>
    public const double DistanciaMinimaKm = 0.3;

    public static double DistanciaKm(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
    {
        var dLat = ARadianes((double)(lat2 - lat1));
        var dLon = ARadianes((double)(lon2 - lon1));
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ARadianes((double)lat1)) * Math.Cos(ARadianes((double)lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return RadioTierraKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    /// <summary>Minutos estimados de traslado en combi; 0 si los puntos están a menos de 300 m.</summary>
    public static int MinutosEstimados(double distanciaKm)
    {
        if (distanciaKm < DistanciaMinimaKm)
            return 0;
        var horas = distanciaKm * FactorCarretera / VelocidadPromedioKmH;
        return (int)Math.Ceiling(horas * 60);
    }

    private static double ARadianes(double grados) => grados * Math.PI / 180.0;
}
