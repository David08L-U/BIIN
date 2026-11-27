using Biin.Application.DTOs.Contenidos;
using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Contenidos;

/// <summary>Pruebas de consulta pública de recorridos sugeridos (CU-13, RNF07).</summary>
public class RecorridosServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly DatosPrueba _d;
    private readonly RecorridosService _servicio;

    public RecorridosServiceTests()
    {
        _d = DatosPrueba.Sembrar(_db);
        SembrarRecorridos();
        _servicio = new RecorridosService(_db);
    }

    [Fact]
    public async Task Listar_devuelve_solo_publicados_filtra_sin_acentos_y_calcula_duracion_total()
    {
        var todos = await _servicio.ListarAsync(new FiltroRecorridosRequest());
        var homun = Assert.Single(todos.Items);
        Assert.Equal("Un día de cenotes en Homún", homun.Titulo);
        Assert.Equal(4, homun.TotalEtapas);
        Assert.Equal(300, homun.DuracionTotalMin);
        Assert.Equal("/fotos/cocina-1.jpg", homun.FotoPrincipal);

        var porTexto = await _servicio.ListarAsync(new FiltroRecorridosRequest(Busqueda: "homun"));
        Assert.Single(porTexto.Items);

        var porOtraLocalidad = await _servicio.ListarAsync(new FiltroRecorridosRequest(IdLocalidadBase: _d.LocMerida.IdLocalidad));
        Assert.Empty(porOtraLocalidad.Items);
    }

    [Fact]
    public async Task ObtenerPorId_ordena_etapas_incluye_coordenadas_y_avisa_si_un_recurso_dejo_de_estar_disponible()
    {
        var detalle = await _servicio.ObtenerPorIdAsync(1);

        Assert.Equal([1, 2, 3, 4], detalle.Etapas.Select(e => e.Orden).ToList());
        Assert.Equal("Cenote Santa Rosa", detalle.Etapas[0].Titulo);
        Assert.Equal(20.722000m, detalle.Etapas[0].Latitud);
        Assert.True(detalle.Etapas[0].Disponible);
        Assert.Null(detalle.Etapas[0].Aviso);

        // Etapa 3: recurso archivado → Disponible = false con aviso claro
        Assert.False(detalle.Etapas[2].Disponible);
        Assert.Contains("no está publicado", detalle.Etapas[2].Aviso, StringComparison.OrdinalIgnoreCase);

        // Etapa 4: evento cancelado → Disponible = false con aviso de cancelación
        Assert.False(detalle.Etapas[3].Disponible);
        Assert.Contains("cancelado", detalle.Etapas[3].Aviso, StringComparison.OrdinalIgnoreCase);

        // Recorrido pendiente no visible al público
        await Assert.ThrowsAsync<NoEncontradoException>(() => _servicio.ObtenerPorIdAsync(2));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _servicio.ObtenerPorIdAsync(0));
    }

    private void SembrarRecorridos()
    {
        var publicado = new RecorridoSugerido
        {
            IdRecorrido = 1,
            Titulo = "Un día de cenotes en Homún",
            Descripcion = "Cenotes y comida regional",
            IdLocalidadBase = _d.LocHomun.IdLocalidad,
            LocalidadBase = _d.LocHomun,
            EstadoPublicacion = EstadoPublicacion.Publicado,
            ActualizadoEn = new DateTime(2026, 12, 5, 18, 0, 0, DateTimeKind.Utc)
        };
        publicado.Etapas.Add(new EtapaRecorrido { IdRecorrido = 1, Orden = 2, IdRecurso = _d.CocinaHomun.IdRecurso, Recurso = _d.CocinaHomun, DuracionSugeridaMin = 60, Recorrido = publicado });
        publicado.Etapas.Add(new EtapaRecorrido { IdRecorrido = 1, Orden = 1, IdRecurso = _d.CenotePublicado.IdRecurso, Recurso = _d.CenotePublicado, DuracionSugeridaMin = 120, Recorrido = publicado });
        publicado.Etapas.Add(new EtapaRecorrido { IdRecorrido = 1, Orden = 3, IdRecurso = _d.CenoteArchivado.IdRecurso, Recurso = _d.CenoteArchivado, DuracionSugeridaMin = 60, Recorrido = publicado });
        publicado.Etapas.Add(new EtapaRecorrido { IdRecorrido = 1, Orden = 4, IdRecurso = _d.ConciertoCancelado.IdRecurso, Recurso = _d.ConciertoCancelado, DuracionSugeridaMin = 60, Recorrido = publicado });

        var pendiente = new RecorridoSugerido
        {
            IdRecorrido = 2,
            Titulo = "Borrador sin publicar",
            IdLocalidadBase = _d.LocMerida.IdLocalidad,
            LocalidadBase = _d.LocMerida,
            EstadoPublicacion = EstadoPublicacion.Pendiente,
            ActualizadoEn = DateTime.UtcNow
        };

        _db.Set<RecorridoSugerido>().Items.AddRange([publicado, pendiente]);
    }
}
