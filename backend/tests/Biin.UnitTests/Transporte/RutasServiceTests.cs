using Biin.Application.DTOs.Transporte;
using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.Domain.Vistas;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Transporte;

/// <summary>Pruebas de búsqueda de rutas origen→destino y rutas cercanas (RF02, CU-02, RNF05, 10.1.7).</summary>
public class RutasServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly RelojFijo _reloj = new(); // Lunes 7 dic 2026, 12:00 Yucatán (18:00 UTC)
    private readonly RutasService _servicio;

    public RutasServiceTests()
    {
        SembrarEscenario();
        _servicio = new RutasService(_db, _reloj);
    }

    [Fact]
    public async Task Buscar_por_origen_y_destino_respeta_orden_de_paradas_y_abordaje_descenso()
    {
        // Mérida -> Homún debe encontrar solo la ruta de ida (no la de regreso)
        var ida = await _servicio.BuscarAsync(new FiltroRutasRequest(Origen: "merida", Destino: "homun"));
        var rutaIda = Assert.Single(ida.Items);
        Assert.Equal("DEMO-MER-HOM", rutaIda.Codigo);
        Assert.Equal("Mérida", rutaIda.Origen);
        Assert.Equal("Homún", rutaIda.Destino);
        Assert.Equal(45m, rutaIda.TarifaAproximada);
        Assert.Equal(VCupoVigente.EstadoVigente, rutaIda.EstadoCupo);
        Assert.Equal(6, rutaIda.AsientosDisponibles);

        // Homún -> Mérida debe encontrar solo la ruta de regreso
        var regreso = await _servicio.BuscarAsync(new FiltroRutasRequest(Origen: "Homún", Destino: "Mérida"));
        var rutaRegreso = Assert.Single(regreso.Items);
        Assert.Equal("DEMO-HOM-MER", rutaRegreso.Codigo);
        Assert.Equal(45m, rutaRegreso.TarifaAproximada);
        Assert.Equal(VCupoVigente.EstadoNoConfirmado, rutaRegreso.EstadoCupo);

        // Tramo intermedio: Acanceh -> Homún
        var intermedio = await _servicio.BuscarAsync(new FiltroRutasRequest(IdLocalidadOrigen: 2, IdLocalidadDestino: 3));
        var rutaIntermedia = Assert.Single(intermedio.Items);
        Assert.Equal("DEMO-MER-HOM", rutaIntermedia.Codigo);
        Assert.Equal(25m, rutaIntermedia.TarifaAproximada);
    }

    [Fact]
    public async Task Buscar_filtra_por_dia_de_semana_devuelve_vacio_sin_coincidencias_y_oculta_no_publicadas()
    {
        // La ruta DEMO-MER-HOM opera lunes (1); la ruta solo sábado (6) no aparece en lunes
        var lunes = await _servicio.BuscarAsync(new FiltroRutasRequest(DiaSemana: 1));
        Assert.All(lunes.Items, r => Assert.NotEqual("DEMO-SABADO", r.Codigo));
        Assert.DoesNotContain(lunes.Items, r => r.Codigo is "DEMO-PENDIENTE" or "DEMO-INACTIVA");

        // Destino sin rutas: devuelve lista vacía 200, no excepción
        var sinResultados = await _servicio.BuscarAsync(new FiltroRutasRequest(Origen: "Mérida", Destino: "Valladolid"));
        Assert.Empty(sinResultados.Items);
        Assert.Equal(0, sinResultados.Total);

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.BuscarAsync(new FiltroRutasRequest(DiaSemana: 7)));
    }

    [Fact]
    public async Task BuscarCercanas_devuelve_rutas_ordenadas_por_parada_de_abordaje_mas_proxima()
    {
        // Posición cerca de Homún
        var cercanas = await _servicio.BuscarCercanasAsync(
            new FiltroRutasCercanasRequest(20.7390m, -89.2858m, RadioKm: 50, Limite: 10));

        Assert.Equal(2, cercanas.Count);
        Assert.Equal("DEMO-HOM-MER", cercanas[0].Codigo);
        Assert.Equal("Homún", cercanas[0].LocalidadParada);
        Assert.Equal("Mérida", cercanas[0].DestinoFinal);
        Assert.Equal(45m, cercanas[0].TarifaAproximada);

        // La segunda ruta es DEMO-MER-HOM con su parada intermedia de Acanceh (~19 km, más cercana que Mérida)
        Assert.Equal("DEMO-MER-HOM", cercanas[1].Codigo);
        Assert.Equal("Acanceh", cercanas[1].LocalidadParada);
        Assert.Equal(25m, cercanas[1].TarifaAproximada);
    }

    private void SembrarEscenario()
    {
        var munMer = new Municipio { IdMunicipio = 1, Codigo = "050", Nombre = "Mérida" };
        var munAca = new Municipio { IdMunicipio = 2, Codigo = "002", Nombre = "Acanceh" };
        var munHom = new Municipio { IdMunicipio = 3, Codigo = "036", Nombre = "Homún" };

        var locMer = new Localidad { IdLocalidad = 1, IdMunicipio = 1, Nombre = "Mérida", Municipio = munMer };
        var locAca = new Localidad { IdLocalidad = 2, IdMunicipio = 2, Nombre = "Acanceh", Municipio = munAca };
        var locHom = new Localidad { IdLocalidad = 3, IdMunicipio = 3, Nombre = "Homún", Municipio = munHom };

        var ubMer = new Ubicacion { IdUbicacion = 1, IdLocalidad = 1, Localidad = locMer, DireccionReferencia = "Centro Mérida", Latitud = 20.9674m, Longitud = -89.6237m };
        var ubAca = new Ubicacion { IdUbicacion = 2, IdLocalidad = 2, Localidad = locAca, DireccionReferencia = "Centro Acanceh", Latitud = 20.8136m, Longitud = -89.4527m };
        var ubHom = new Ubicacion { IdUbicacion = 3, IdLocalidad = 3, Localidad = locHom, DireccionReferencia = "Plaza Homún", Latitud = 20.7390m, Longitud = -89.2858m };

        // Ruta 1: Ida Mérida -> Acanceh -> Homún
        var ida = new Ruta
        {
            IdRecurso = 1, Codigo = "DEMO-MER-HOM", Activa = true,
            Recurso = new Recurso { IdRecurso = 1, Tipo = TipoRecurso.Ruta, Titulo = "Mérida a Homún", Descripcion = "Combi directa", EstadoPublicacion = EstadoPublicacion.Publicado, ActualizadoEn = _reloj.AhoraUtc }
        };
        ida.Paradas.Add(new RutaParada { IdRuta = 1, Orden = 1, IdUbicacion = 1, Ubicacion = ubMer, PermiteAbordar = true, PermiteDescender = false, Ruta = ida });
        ida.Paradas.Add(new RutaParada { IdRuta = 1, Orden = 2, IdUbicacion = 2, Ubicacion = ubAca, PermiteAbordar = true, PermiteDescender = true, Ruta = ida });
        ida.Paradas.Add(new RutaParada { IdRuta = 1, Orden = 3, IdUbicacion = 3, Ubicacion = ubHom, PermiteAbordar = false, PermiteDescender = true, Ruta = ida });
        ida.Horarios.Add(new HorarioRuta { IdHorario = 1, IdRuta = 1, DiaSemana = 1, HoraSalida = new TimeOnly(14, 0), VigenteDesde = new DateOnly(2026, 1, 1), Ruta = ida });
        ida.Tarifas.Add(new Tarifa { IdTarifa = 1, IdRuta = 1, OrdenOrigen = 1, OrdenDestino = 3, Monto = 45m, VigenteDesde = new DateOnly(2026, 1, 1), Ruta = ida });
        ida.Tarifas.Add(new Tarifa { IdTarifa = 2, IdRuta = 1, OrdenOrigen = 2, OrdenDestino = 3, Monto = 25m, VigenteDesde = new DateOnly(2026, 1, 1), Ruta = ida });

        // Ruta 2: Regreso Homún -> Acanceh -> Mérida
        var regreso = new Ruta
        {
            IdRecurso = 2, Codigo = "DEMO-HOM-MER", Activa = true,
            Recurso = new Recurso { IdRecurso = 2, Tipo = TipoRecurso.Ruta, Titulo = "Homún a Mérida", EstadoPublicacion = EstadoPublicacion.Publicado, ActualizadoEn = _reloj.AhoraUtc }
        };
        regreso.Paradas.Add(new RutaParada { IdRuta = 2, Orden = 1, IdUbicacion = 3, Ubicacion = ubHom, PermiteAbordar = true, PermiteDescender = false, Ruta = regreso });
        regreso.Paradas.Add(new RutaParada { IdRuta = 2, Orden = 2, IdUbicacion = 2, Ubicacion = ubAca, PermiteAbordar = true, PermiteDescender = true, Ruta = regreso });
        regreso.Paradas.Add(new RutaParada { IdRuta = 2, Orden = 3, IdUbicacion = 1, Ubicacion = ubMer, PermiteAbordar = false, PermiteDescender = true, Ruta = regreso });
        regreso.Horarios.Add(new HorarioRuta { IdHorario = 2, IdRuta = 2, DiaSemana = 1, HoraSalida = new TimeOnly(16, 0), VigenteDesde = new DateOnly(2026, 1, 1), Ruta = regreso });
        regreso.Tarifas.Add(new Tarifa { IdTarifa = 3, IdRuta = 2, OrdenOrigen = 1, OrdenDestino = 3, Monto = 45m, VigenteDesde = new DateOnly(2026, 1, 1), Ruta = regreso });

        // Ruta 3: Solo sábado
        var sabado = new Ruta
        {
            IdRecurso = 3, Codigo = "DEMO-SABADO", Activa = true,
            Recurso = new Recurso { IdRecurso = 3, Tipo = TipoRecurso.Ruta, Titulo = "Solo Sábado", EstadoPublicacion = EstadoPublicacion.Publicado, ActualizadoEn = _reloj.AhoraUtc }
        };
        sabado.Paradas.Add(new RutaParada { IdRuta = 3, Orden = 1, IdUbicacion = 1, Ubicacion = ubMer, PermiteAbordar = true, PermiteDescender = false, Ruta = sabado });
        sabado.Paradas.Add(new RutaParada { IdRuta = 3, Orden = 2, IdUbicacion = 2, Ubicacion = ubAca, PermiteAbordar = false, PermiteDescender = true, Ruta = sabado });
        sabado.Horarios.Add(new HorarioRuta { IdHorario = 3, IdRuta = 3, DiaSemana = 6, HoraSalida = new TimeOnly(9, 0), VigenteDesde = new DateOnly(2026, 1, 1), Ruta = sabado });

        // Rutas ocultas: pendiente e inactiva
        var pendiente = new Ruta { IdRecurso = 4, Codigo = "DEMO-PENDIENTE", Activa = true, Recurso = new Recurso { IdRecurso = 4, Tipo = TipoRecurso.Ruta, Titulo = "Pendiente", EstadoPublicacion = EstadoPublicacion.Pendiente } };
        var inactiva = new Ruta { IdRecurso = 5, Codigo = "DEMO-INACTIVA", Activa = false, Recurso = new Recurso { IdRecurso = 5, Tipo = TipoRecurso.Ruta, Titulo = "Inactiva", EstadoPublicacion = EstadoPublicacion.Publicado } };

        _db.RutasSet.Items.AddRange([ida, regreso, sabado, pendiente, inactiva]);

        // Vista v_paradas_ruta
        foreach (var r in new[] { ida, regreso })
        {
            foreach (var p in r.Paradas)
            {
                _db.Set<VParadaRuta>().Items.Add(new VParadaRuta
                {
                    IdRuta = r.IdRecurso, Codigo = r.Codigo, Ruta = r.Recurso.Titulo, Orden = p.Orden,
                    PermiteAbordar = p.PermiteAbordar, PermiteDescender = p.PermiteDescender,
                    IdUbicacion = p.IdUbicacion, DireccionReferencia = p.Ubicacion.DireccionReferencia,
                    Latitud = p.Ubicacion.Latitud, Longitud = p.Ubicacion.Longitud,
                    IdLocalidad = p.Ubicacion.IdLocalidad, Localidad = p.Ubicacion.Localidad.Nombre,
                    IdMunicipio = p.Ubicacion.Localidad.IdMunicipio, Municipio = p.Ubicacion.Localidad.Municipio.Nombre
                });
            }
        }

        // Vista v_cupo_vigente
        _db.Set<VCupoVigente>().Items.AddRange(
        [
            new VCupoVigente
            {
                IdSalida = 100, IdRuta = 1, SalidaProgramada = _reloj.AhoraUtc.AddHours(2),
                CapacidadHabilitada = 15, EstadoSalida = EstadoSalida.Programada,
                EstadoCupo = VCupoVigente.EstadoVigente, AsientosDisponibles = 6,
                RegistradoEn = _reloj.AhoraUtc.AddMinutes(-5), ValidoHasta = _reloj.AhoraUtc.AddMinutes(25)
            },
            new VCupoVigente
            {
                IdSalida = 101, IdRuta = 2, SalidaProgramada = _reloj.AhoraUtc.AddHours(3),
                CapacidadHabilitada = 18, EstadoSalida = EstadoSalida.Programada,
                EstadoCupo = VCupoVigente.EstadoNoConfirmado, AsientosDisponibles = null
            }
        ]);
    }
}
