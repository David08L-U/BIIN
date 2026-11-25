using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Itinerarios;

public class AnalizadorItinerarioTests
{
    private readonly DatosPrueba _d = DatosPrueba.Sembrar(new FakeAppDbContext());

    // Sábado 12 dic 2026 en Yucatán (UTC−6)
    private static DateTime Sabado(int hora, int minuto = 0) =>
        new DateTime(2026, 12, 12, hora, minuto, 0, DateTimeKind.Utc).AddHours(6);

    private Itinerario Itinerario(params ActividadItinerario[] actividades)
    {
        var it = new Itinerario
        {
            IdItinerario = 1, IdUsuario = 1, Nombre = "Fin de semana en Homún",
            Inicio = new DateOnly(2026, 12, 12), Fin = new DateOnly(2026, 12, 13)
        };
        var orden = 1;
        foreach (var a in actividades)
        {
            a.IdActividad = orden;
            a.Orden = orden++;
            a.Itinerario = it;
            a.IdRecurso = a.Recurso.IdRecurso;
            it.Actividades.Add(a);
        }
        return it;
    }

    private static ActividadItinerario Actividad(Recurso r, DateTime? inicio = null, DateTime? fin = null) =>
        new() { Recurso = r, InicioPrevisto = inicio, FinPrevisto = fin };

    [Fact]
    public void Itinerario_sin_problemas_no_tiene_advertencias_y_calcula_traslados()
    {
        // En los datos base el cenote solo abre los lunes; aquí también abre el sábado
        _d.CenotePublicado.HorariosVisita.Add(new HorarioVisita
        {
            DiaSemana = 6, HoraApertura = new TimeOnly(9, 0), HoraCierre = new TimeOnly(17, 0)
        });
        var it = Itinerario(
            Actividad(_d.CenotePublicado, Sabado(10), Sabado(12)),
            Actividad(_d.CocinaHomun, Sabado(13), Sabado(14)));

        var (actividades, advertencias) = AnalizadorItinerario.Analizar(it);

        Assert.Empty(advertencias);
        Assert.Null(actividades[0].TrasladoDesdeAnterior);
        Assert.NotNull(actividades[1].TrasladoDesdeAnterior);
        Assert.InRange(actividades[1].TrasladoDesdeAnterior!.DistanciaKm, 1, 3);
        Assert.Equal("Homún", actividades[1].Localidad);
    }

    [Fact]
    public void Advierte_horarios_encimados()
    {
        var it = Itinerario(
            Actividad(_d.CenotePublicado, Sabado(10), Sabado(13)),
            Actividad(_d.CocinaHomun, Sabado(12), Sabado(14)));

        var (_, advertencias) = AnalizadorItinerario.Analizar(it);

        var conflicto = Assert.Single(advertencias, a => a.Tipo == AnalizadorItinerario.ConflictoHorario);
        Assert.Equal([1, 2], conflicto.IdActividades);
    }

    [Fact]
    public void Advierte_traslado_insuficiente_entre_municipios()
    {
        // Homún → Mérida son unos 85 minutos; solo se dejan 30
        var it = Itinerario(
            Actividad(_d.CocinaHomun, Sabado(12), Sabado(13)),
            Actividad(_d.MarisqueriaMerida, Sabado(13, 30), Sabado(15)));

        var (_, advertencias) = AnalizadorItinerario.Analizar(it);

        Assert.Single(advertencias, a => a.Tipo == AnalizadorItinerario.TrasladoInsuficiente);
    }

    [Fact]
    public void Advierte_actividad_fuera_de_las_fechas_del_viaje()
    {
        var lunes = new DateTime(2026, 12, 14, 16, 0, 0, DateTimeKind.Utc);
        var it = Itinerario(Actividad(_d.CocinaHomun, lunes, lunes.AddHours(1)));

        var (_, advertencias) = AnalizadorItinerario.Analizar(it);

        Assert.Single(advertencias, a => a.Tipo == AnalizadorItinerario.FueraDeFechas);
    }

    [Fact]
    public void Advierte_visita_fuera_de_horario_solo_si_hay_horarios()
    {
        // La cocina cierra a las 17:00; la marisquería no tiene horarios registrados
        var it = Itinerario(
            Actividad(_d.CocinaHomun, Sabado(19), Sabado(20)),
            Actividad(_d.MarisqueriaMerida, Sabado(23), null));

        var (_, advertencias) = AnalizadorItinerario.Analizar(it);

        var fuera = Assert.Single(advertencias, a => a.Tipo == AnalizadorItinerario.FueraDeHorario);
        Assert.Equal([1], fuera.IdActividades);
    }

    [Fact]
    public void Advierte_evento_cancelado_y_contenido_retirado()
    {
        _d.CenotePublicado.EstadoPublicacion = EstadoPublicacion.Archivado;
        var it = Itinerario(Actividad(_d.ConciertoCancelado), Actividad(_d.CenotePublicado));

        var (actividades, advertencias) = AnalizadorItinerario.Analizar(it);

        Assert.Contains(advertencias, a => a.Tipo == AnalizadorItinerario.EventoCancelado);
        Assert.Contains(advertencias, a => a.Tipo == AnalizadorItinerario.ContenidoNoDisponible);
        Assert.False(actividades[1].Disponible);
    }

    [Fact]
    public void Ruta_sin_ubicacion_unica_no_calcula_traslado()
    {
        var it = Itinerario(Actividad(_d.RutaMeridaHomun), Actividad(_d.CenotePublicado));

        var (actividades, _) = AnalizadorItinerario.Analizar(it);

        Assert.Null(actividades[1].TrasladoDesdeAnterior);
        Assert.Null(actividades[0].Localidad);
    }
}
