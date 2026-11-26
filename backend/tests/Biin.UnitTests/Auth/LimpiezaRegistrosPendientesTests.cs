using Biin.Application.Services;
using Biin.Domain.Entities;
using Biin.UnitTests.Fakes;
using Microsoft.Extensions.Options;

namespace Biin.UnitTests.Auth;

/// <summary>Pruebas de la limpieza automática de registros pendientes expirados (RF01, RNF04).</summary>
public class LimpiezaRegistrosPendientesTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly RelojFijo _reloj = new();

    [Fact]
    public async Task LimpiarVencidos_borra_expirados_y_conserva_los_vigentes()
    {
        var ahora = _reloj.AhoraUtc;
        _db.RegistrosPendientesSet.Items.AddRange(
        [
            Pendiente(1, "expirado1@biin.test", ahora.AddMinutes(-30)),
            Pendiente(2, "justo@biin.test", ahora),
            Pendiente(3, "vigente@biin.test", ahora.AddMinutes(5))
        ]);

        var servicio = new LimpiezaRegistrosPendientesService(_db, _reloj, Options.Create(new VerificacionCorreoOptions()));
        var eliminados = await servicio.LimpiarVencidosAsync();

        Assert.Equal(2, eliminados);
        var restante = Assert.Single(_db.RegistrosPendientesSet.Items);
        Assert.Equal("vigente@biin.test", restante.Correo);
    }

    [Fact]
    public async Task LimpiarVencidos_respeta_el_limite_de_lote_eliminando_los_mas_antiguos_primero()
    {
        var ahora = _reloj.AhoraUtc;
        _db.RegistrosPendientesSet.Items.AddRange(
        [
            Pendiente(1, "antiguo1@biin.test", ahora.AddHours(-3)),
            Pendiente(2, "antiguo2@biin.test", ahora.AddHours(-2)),
            Pendiente(3, "antiguo3@biin.test", ahora.AddHours(-1))
        ]);

        var opciones = new VerificacionCorreoOptions { LoteLimpieza = 2 };
        var servicio = new LimpiezaRegistrosPendientesService(_db, _reloj, Options.Create(opciones));

        var eliminados = await servicio.LimpiarVencidosAsync();

        Assert.Equal(2, eliminados);
        var restante = Assert.Single(_db.RegistrosPendientesSet.Items);
        Assert.Equal("antiguo3@biin.test", restante.Correo);
    }

    [Fact]
    public async Task LimpiarVencidos_devuelve_cero_si_todos_siguen_vigentes()
    {
        _db.RegistrosPendientesSet.Items.Add(Pendiente(1, "vigente@biin.test", _reloj.AhoraUtc.AddMinutes(10)));

        var servicio = new LimpiezaRegistrosPendientesService(_db, _reloj, Options.Create(new VerificacionCorreoOptions()));
        var eliminados = await servicio.LimpiarVencidosAsync();

        Assert.Equal(0, eliminados);
        Assert.Single(_db.RegistrosPendientesSet.Items);
    }

    private static RegistroPendiente Pendiente(int id, string correo, DateTime expiraEnUtc) => new()
    {
        IdRegistro = id,
        Nombre = "Viajero",
        Correo = correo,
        HashContrasena = "hash::Clave1234",
        HashCodigo = "hash::123456",
        EnviadoEn = expiraEnUtc.AddMinutes(-15),
        ExpiraEn = expiraEnUtc
    };
}
