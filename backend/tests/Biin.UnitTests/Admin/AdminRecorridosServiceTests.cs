using Biin.Application.DTOs.Admin;
using Biin.Application.Interfaces;
using Biin.Application.Services;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Biin.UnitTests.Fakes;

namespace Biin.UnitTests.Admin;

/// <summary>Pruebas de administración de recorridos sugeridos, etapas y bitácora (RF12, CU-12, CU-13).</summary>
public class AdminRecorridosServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly DatosPrueba _d;
    private readonly AdminRecorridosService _servicio;

    public AdminRecorridosServiceTests()
    {
        _d = DatosPrueba.Sembrar(_db);
        _servicio = new AdminRecorridosService(_db, new RelojFijo(), new BitacoraAdminService(_db));
    }

    [Fact]
    public async Task Ciclo_completo_crear_editar_etapas_publicar_y_archivar_registra_bitacora()
    {
        var creado = await _servicio.CrearAsync(_d.Creador.IdUsuario, new CrearRecorridoRequest(
            "Ruta de cenotes y sabores",
            "Plan sugerido de un día",
            _d.LocHomun.IdLocalidad,
            [new EtapaRecorridoInput(_d.CenotePublicado.IdRecurso, 120)]));

        Assert.Equal(EstadoPublicacion.Pendiente, creado.EstadoPublicacion);
        Assert.Single(creado.Etapas);

        // No puede publicarse con menos de 2 etapas
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.PublicarAsync(_d.Creador.IdUsuario, creado.IdRecorrido));

        // Agregar etapa con contenido publicado y editar título
        await _servicio.ActualizarAsync(_d.Creador.IdUsuario, creado.IdRecorrido, new ActualizarRecorridoRequest(
            "Ruta de cenotes en Homún", "Descripción actualizada", _d.LocHomun.IdLocalidad));

        var conEtapas = await _servicio.ReemplazarEtapasAsync(_d.Creador.IdUsuario, creado.IdRecorrido,
            new ReemplazarEtapasRecorridoRequest(
            [
                new EtapaRecorridoInput(_d.CenotePublicado.IdRecurso, 120),
                new EtapaRecorridoInput(_d.CocinaHomun.IdRecurso, 60)
            ]));
        Assert.Equal(180, conEtapas.DuracionTotalMin);

        var publicado = await _servicio.PublicarAsync(_d.Creador.IdUsuario, creado.IdRecorrido);
        Assert.Equal(EstadoPublicacion.Publicado, publicado.EstadoPublicacion);

        // Estando publicado, no permite reemplazar con contenido pendiente
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.ReemplazarEtapasAsync(_d.Creador.IdUsuario, creado.IdRecorrido,
                new ReemplazarEtapasRecorridoRequest(
                [
                    new EtapaRecorridoInput(_d.CenotePublicado.IdRecurso, 60),
                    new EtapaRecorridoInput(_d.NegocioPendiente.IdRecurso, 60)
                ])));

        var archivado = await _servicio.ArchivarAsync(_d.Creador.IdUsuario, creado.IdRecorrido);
        Assert.Equal(EstadoPublicacion.Archivado, archivado.EstadoPublicacion);

        Assert.Equal(
            [AccionesBitacora.Crear, AccionesBitacora.Editar, AccionesBitacora.Editar, AccionesBitacora.Publicar, AccionesBitacora.Archivar],
            _db.BitacoraAdminSet.Items.Select(b => b.Accion).ToList());
    }

    [Fact]
    public async Task Publicar_rechaza_etapas_con_contenidos_no_publicados_y_valida_localidad()
    {
        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.CrearAsync(_d.Creador.IdUsuario, new CrearRecorridoRequest("Inválido", null, 999)));

        var creado = await _servicio.CrearAsync(_d.Creador.IdUsuario, new CrearRecorridoRequest(
            "Con pendiente", null, _d.LocHomun.IdLocalidad,
            [
                new EtapaRecorridoInput(_d.CenotePublicado.IdRecurso, 60),
                new EtapaRecorridoInput(_d.NegocioPendiente.IdRecurso, 60)
            ]));

        await Assert.ThrowsAsync<ReglaNegocioException>(() =>
            _servicio.PublicarAsync(_d.Creador.IdUsuario, creado.IdRecorrido));
    }
}
