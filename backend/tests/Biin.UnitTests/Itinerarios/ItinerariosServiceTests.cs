using Biin.Application.DTOs.Itinerarios;
using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Itinerarios;

public class ItinerariosServiceTests
{
    private const int Viajera = 1;
    private const int OtroViajero = 2;

    private readonly FakeAppDbContext _db = new();
    private readonly DatosPrueba _d;
    private readonly ItinerariosService _servicio;

    public ItinerariosServiceTests()
    {
        _d = DatosPrueba.Sembrar(_db);
        _servicio = new ItinerariosService(_db, new RelojFijo());
    }

    private static CrearItinerarioRequest Fin_de_semana() =>
        new("Fin de semana en Homún", new DateOnly(2026, 12, 12), new DateOnly(2026, 12, 13), 1500);

    private static DateTime SabadoUtc(int horaLocal) => new DateTime(2026, 12, 12, horaLocal + 6, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task Crear_y_listar_solo_los_itinerarios_propios()
    {
        var creado = await _servicio.CrearAsync(Viajera, Fin_de_semana());
        await _servicio.CrearAsync(OtroViajero, Fin_de_semana() with { Nombre = "Ajeno" });

        var mios = await _servicio.ListarAsync(Viajera);

        Assert.True(creado.IdItinerario > 0);
        var resumen = Assert.Single(mios);
        Assert.Equal("Fin de semana en Homún", resumen.Nombre);
        Assert.Equal(0, resumen.TotalActividades);
    }

    [Theory]
    [InlineData("2026-12-13", "2026-12-12")]   // fin antes del inicio
    [InlineData("2026-12-01", "2027-03-01")]   // más de 60 días
    public async Task Crear_rechaza_fechas_invalidas(string inicio, string fin)
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.CrearAsync(Viajera,
            new CrearItinerarioRequest("Viaje", DateOnly.Parse(inicio), DateOnly.Parse(fin))));
    }

    [Fact]
    public async Task Crear_rechaza_nombre_corto_y_presupuesto_negativo()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CrearAsync(Viajera, Fin_de_semana() with { Nombre = " a " }));
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CrearAsync(Viajera, Fin_de_semana() with { PresupuestoEstimado = -1 }));
    }

    [Fact]
    public async Task Itinerario_ajeno_responde_como_inexistente()
    {
        var ajeno = await _servicio.CrearAsync(OtroViajero, Fin_de_semana());

        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerAsync(Viajera, ajeno.IdItinerario));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.EliminarAsync(Viajera, ajeno.IdItinerario));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.AgregarActividadAsync(
            Viajera, ajeno.IdItinerario, new AgregarActividadRequest(_d.CocinaHomun.IdRecurso)));
    }

    [Fact]
    public async Task Agregar_actividades_asigna_orden_y_toma_horas_del_evento()
    {
        var it = await _servicio.CrearAsync(Viajera, Fin_de_semana());

        await _servicio.AgregarActividadAsync(Viajera, it.IdItinerario,
            new AgregarActividadRequest(_d.CocinaHomun.IdRecurso, SabadoUtc(13), SabadoUtc(14), "  Probar el relleno negro  "));
        var detalle = await _servicio.AgregarActividadAsync(Viajera, it.IdItinerario,
            new AgregarActividadRequest(_d.Vaqueria.IdRecurso));

        Assert.Equal([1, 2], detalle.Actividades.Select(a => a.Orden));
        Assert.Equal("Probar el relleno negro", detalle.Actividades[0].Notas);
        Assert.Equal(_d.Vaqueria.Evento!.Inicio, detalle.Actividades[1].InicioPrevisto);
        Assert.Empty(detalle.Advertencias);
    }

    [Fact]
    public async Task Agregar_rechaza_contenido_no_publicado_inexistente_y_horas_invertidas()
    {
        var it = await _servicio.CrearAsync(Viajera, Fin_de_semana());

        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.AgregarActividadAsync(
            Viajera, it.IdItinerario, new AgregarActividadRequest(_d.NegocioPendiente.IdRecurso)));
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.AgregarActividadAsync(
            Viajera, it.IdItinerario, new AgregarActividadRequest(9999)));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.AgregarActividadAsync(
            Viajera, it.IdItinerario, new AgregarActividadRequest(_d.CocinaHomun.IdRecurso, SabadoUtc(14), SabadoUtc(13))));
    }

    [Fact]
    public async Task Agregar_rechaza_horas_sin_zona_horaria()
    {
        var it = await _servicio.CrearAsync(Viajera, Fin_de_semana());
        var sinZona = new DateTime(2026, 12, 12, 13, 0, 0, DateTimeKind.Unspecified);

        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.AgregarActividadAsync(
            Viajera, it.IdItinerario, new AgregarActividadRequest(_d.CocinaHomun.IdRecurso, sinZona)));
    }

    [Fact]
    public async Task Conflicto_de_horario_se_devuelve_como_advertencia_sin_bloquear()
    {
        var it = await _servicio.CrearAsync(Viajera, Fin_de_semana());
        await _servicio.AgregarActividadAsync(Viajera, it.IdItinerario,
            new AgregarActividadRequest(_d.CocinaHomun.IdRecurso, SabadoUtc(12), SabadoUtc(14)));

        var detalle = await _servicio.AgregarActividadAsync(Viajera, it.IdItinerario,
            new AgregarActividadRequest(_d.MarisqueriaMerida.IdRecurso, SabadoUtc(13), SabadoUtc(15)));

        Assert.Equal(2, detalle.Actividades.Count);
        Assert.Contains(detalle.Advertencias, a => a.Tipo == AnalizadorItinerario.ConflictoHorario);
    }

    [Fact]
    public async Task Actualizar_y_quitar_actividad()
    {
        var it = await _servicio.CrearAsync(Viajera, Fin_de_semana());
        var conUna = await _servicio.AgregarActividadAsync(Viajera, it.IdItinerario,
            new AgregarActividadRequest(_d.CocinaHomun.IdRecurso));
        var idActividad = conUna.Actividades[0].IdActividad;

        var editado = await _servicio.ActualizarActividadAsync(Viajera, it.IdItinerario, idActividad,
            new ActualizarActividadRequest(SabadoUtc(9), SabadoUtc(10), "Desayuno"));
        Assert.Equal("Desayuno", editado.Actividades[0].Notas);

        var vacio = await _servicio.QuitarActividadAsync(Viajera, it.IdItinerario, idActividad);
        Assert.Empty(vacio.Actividades);
        await Assert.ThrowsAsync<NoEncontradoException>(() =>
            _servicio.QuitarActividadAsync(Viajera, it.IdItinerario, idActividad));
    }

    [Fact]
    public async Task Reordenar_exige_todas_las_actividades_y_asigna_1_a_n()
    {
        var it = await _servicio.CrearAsync(Viajera, Fin_de_semana());
        foreach (var r in new[] { _d.CocinaHomun, _d.CenotePublicado, _d.Vaqueria })
            await _servicio.AgregarActividadAsync(Viajera, it.IdItinerario, new AgregarActividadRequest(r.IdRecurso));
        var ids = (await _servicio.ObtenerAsync(Viajera, it.IdItinerario)).Actividades.Select(a => a.IdActividad).ToList();

        var reordenado = await _servicio.ReordenarActividadesAsync(Viajera, it.IdItinerario,
            new ReordenarActividadesRequest([ids[2], ids[0], ids[1]]));

        Assert.Equal(["Vaquería en la plaza", "Cocina económica Doña Mary", "Cenote Santa Rosa"],
            reordenado.Actividades.Select(a => a.Titulo));
        Assert.Equal([1, 2, 3], reordenado.Actividades.Select(a => a.Orden));

        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.ReordenarActividadesAsync(
            Viajera, it.IdItinerario, new ReordenarActividadesRequest([ids[0], ids[1]])));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.ReordenarActividadesAsync(
            Viajera, it.IdItinerario, new ReordenarActividadesRequest([ids[0], ids[0], ids[1]])));
    }

    [Fact]
    public async Task Editar_fechas_advierte_actividades_que_quedan_fuera_y_eliminar_borra_todo()
    {
        var it = await _servicio.CrearAsync(Viajera, Fin_de_semana());
        await _servicio.AgregarActividadAsync(Viajera, it.IdItinerario, new AgregarActividadRequest(_d.Vaqueria.IdRecurso));

        var movido = await _servicio.ActualizarAsync(Viajera, it.IdItinerario, new ActualizarItinerarioRequest(
            "Otro fin de semana", new DateOnly(2026, 12, 19), new DateOnly(2026, 12, 20)));
        Assert.Contains(movido.Advertencias, a => a.Tipo == AnalizadorItinerario.FueraDeFechas);

        await _servicio.EliminarAsync(Viajera, it.IdItinerario);
        Assert.Empty(await _servicio.ListarAsync(Viajera));
        Assert.Empty(_db.Set<ActividadItinerario>().Items);
    }
}
