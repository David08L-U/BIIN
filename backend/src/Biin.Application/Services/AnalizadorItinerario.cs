using Biin.Application.DTOs.Itinerarios;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Biin.Domain.Enums;

namespace Biin.Application.Services;

/// <summary>
/// Arma las actividades de un itinerario con su traslado estimado y calcula las advertencias de CU-09:
/// horarios encimados, traslados que no alcanzan, actividades fuera de las fechas del viaje o del horario
/// de visita, eventos cancelados y contenidos que ya no están publicados. No modifica nada.
/// </summary>
public static class AnalizadorItinerario
{
    public const string ConflictoHorario = "conflicto_horario";
    public const string TrasladoInsuficiente = "traslado_insuficiente";
    public const string FueraDeFechas = "fuera_de_fechas";
    public const string FueraDeHorario = "fuera_de_horario";
    public const string EventoCancelado = "evento_cancelado";
    public const string ContenidoNoDisponible = "contenido_no_disponible";

    public static (IReadOnlyList<ActividadDto> Actividades, IReadOnlyList<AdvertenciaDto> Advertencias) Analizar(
        Itinerario itinerario)
    {
        var ordenadas = itinerario.Actividades.OrderBy(a => a.Orden).ToList();
        var advertencias = new List<AdvertenciaDto>();
        var actividades = new List<ActividadDto>(ordenadas.Count);

        ActividadItinerario? anterior = null;
        foreach (var actividad in ordenadas)
        {
            var traslado = anterior is null ? null : EstimarTraslado(anterior, actividad);
            actividades.Add(AActividadDto(actividad, traslado));

            if (anterior is not null && traslado is not null &&
                anterior.FinPrevisto.HasValue && actividad.InicioPrevisto.HasValue)
            {
                var minutosLibres = (actividad.InicioPrevisto.Value - anterior.FinPrevisto.Value).TotalMinutes;
                if (minutosLibres >= 0 && minutosLibres < traslado.MinutosEstimados)
                    advertencias.Add(new AdvertenciaDto(
                        TrasladoInsuficiente,
                        $"Entre «{anterior.Recurso.Titulo}» y «{actividad.Recurso.Titulo}» hay {minutosLibres:0} minutos, " +
                        $"pero el traslado estimado es de unos {traslado.MinutosEstimados} minutos.",
                        [anterior.IdActividad, actividad.IdActividad]));
            }

            advertencias.AddRange(RevisarActividad(itinerario, actividad));
            anterior = actividad;
        }

        // Horarios encimados entre cualquier par de actividades
        for (var i = 0; i < ordenadas.Count; i++)
        for (var j = i + 1; j < ordenadas.Count; j++)
        {
            if (ordenadas[i].TieneConflictoCon(ordenadas[j]))
                advertencias.Add(new AdvertenciaDto(
                    ConflictoHorario,
                    $"«{ordenadas[i].Recurso.Titulo}» y «{ordenadas[j].Recurso.Titulo}» se enciman en horario.",
                    [ordenadas[i].IdActividad, ordenadas[j].IdActividad]));
        }

        return (actividades, advertencias);
    }

    private static IEnumerable<AdvertenciaDto> RevisarActividad(Itinerario itinerario, ActividadItinerario a)
    {
        var titulo = a.Recurso.Titulo;

        if (a.Recurso.EstadoPublicacion != EstadoPublicacion.Publicado)
            yield return new AdvertenciaDto(ContenidoNoDisponible,
                $"«{titulo}» ya no está disponible en BIIN; considera quitarlo del itinerario.", [a.IdActividad]);

        if (a.Recurso.Evento is { EstadoEvento: EstadoEvento.Cancelado })
            yield return new AdvertenciaDto(EventoCancelado, $"El evento «{titulo}» fue cancelado.", [a.IdActividad]);

        if (a.InicioPrevisto.HasValue || a.FinPrevisto.HasValue)
        {
            var primerDia = itinerario.Inicio;
            var ultimoDia = itinerario.Fin;
            var diaInicio = a.InicioPrevisto.HasValue ? DateOnly.FromDateTime(ZonaYucatan.ALocal(a.InicioPrevisto.Value)) : (DateOnly?)null;
            var diaFin = a.FinPrevisto.HasValue ? DateOnly.FromDateTime(ZonaYucatan.ALocal(a.FinPrevisto.Value)) : (DateOnly?)null;
            if (diaInicio < primerDia || diaFin > ultimoDia || diaInicio > ultimoDia || diaFin < primerDia)
                yield return new AdvertenciaDto(FueraDeFechas,
                    $"«{titulo}» está fuera de las fechas del viaje ({primerDia:dd/MM/yyyy} al {ultimoDia:dd/MM/yyyy}).",
                    [a.IdActividad]);
        }

        // Solo se puede advertir si el lugar o negocio tiene horarios registrados
        if (a.InicioPrevisto.HasValue && a.Recurso.HorariosVisita.Count > 0 &&
            !HorarioVisita.EstaAbierto(a.Recurso.HorariosVisita, ZonaYucatan.ALocal(a.InicioPrevisto.Value)))
            yield return new AdvertenciaDto(FueraDeHorario,
                $"«{titulo}» no tiene horario de visita registrado a esa hora.", [a.IdActividad]);
    }

    private static TrasladoEstimadoDto? EstimarTraslado(ActividadItinerario desde, ActividadItinerario hasta)
    {
        var origen = UbicacionDe(desde.Recurso);
        var destino = UbicacionDe(hasta.Recurso);
        if (origen is null || destino is null)
            return null;

        var km = CalculadoraTraslado.DistanciaKm(origen.Latitud, origen.Longitud, destino.Latitud, destino.Longitud);
        return new TrasladoEstimadoDto(Math.Round(km, 1), CalculadoraTraslado.MinutosEstimados(km));
    }

    /// <summary>Ubicación del detalle del recurso; las rutas no tienen un solo punto y devuelven null.</summary>
    public static Ubicacion? UbicacionDe(Recurso r) =>
        r.Negocio?.Ubicacion ?? r.Evento?.Ubicacion ?? r.Lugar?.Ubicacion;

    private static ActividadDto AActividadDto(ActividadItinerario a, TrasladoEstimadoDto? traslado)
    {
        var ubicacion = UbicacionDe(a.Recurso);
        return new ActividadDto(
            a.IdActividad,
            a.Orden,
            a.IdRecurso,
            a.Recurso.Tipo,
            a.Recurso.Titulo,
            a.Recurso.EstadoPublicacion == EstadoPublicacion.Publicado,
            a.InicioPrevisto,
            a.FinPrevisto,
            a.Notas,
            ubicacion?.Localidad?.Nombre,
            ubicacion?.Latitud,
            ubicacion?.Longitud,
            traslado);
    }
}
