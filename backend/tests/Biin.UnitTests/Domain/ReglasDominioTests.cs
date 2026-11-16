using Biin.Domain.Entities;

namespace Biin.UnitTests.Domain;

public class ReglasDominioTests
{
    [Theory]
    [InlineData("2026-12-01", true)]   // dentro de la vigencia
    [InlineData("2026-11-30", false)]  // antes de empezar
    [InlineData("2027-02-01", false)]  // después de terminar
    public void Tarifa_EsVigente_respeta_el_rango(string fecha, bool esperado)
    {
        var tarifa = new Tarifa
        {
            VigenteDesde = new DateOnly(2026, 12, 1),
            VigenteHasta = new DateOnly(2027, 1, 31)
        };

        Assert.Equal(esperado, tarifa.EsVigente(DateOnly.Parse(fecha)));
    }

    [Fact]
    public void Tarifa_sin_fecha_final_sigue_vigente()
    {
        var tarifa = new Tarifa { VigenteDesde = new DateOnly(2026, 1, 1) };

        Assert.True(tarifa.EsVigente(new DateOnly(2030, 1, 1)));
    }

    [Fact]
    public void ReporteCupo_vencido_no_esta_vigente()
    {
        var ahora = new DateTime(2026, 12, 1, 10, 0, 0, DateTimeKind.Utc);
        var reporte = new ReporteCupo { ValidoHasta = ahora.AddMinutes(-1) };

        Assert.False(reporte.EstaVigente(ahora));
    }

    [Fact]
    public void Actividades_que_se_enciman_tienen_conflicto()
    {
        var a = Actividad(9, 11);
        var b = Actividad(10, 12);

        Assert.True(a.TieneConflictoCon(b));
    }

    [Fact]
    public void Actividades_seguidas_no_tienen_conflicto()
    {
        var a = Actividad(9, 10);
        var b = Actividad(10, 11);

        Assert.False(a.TieneConflictoCon(b));
    }

    private static ActividadItinerario Actividad(int horaInicio, int horaFin) => new()
    {
        InicioPrevisto = new DateTime(2026, 12, 1, horaInicio, 0, 0, DateTimeKind.Utc),
        FinPrevisto = new DateTime(2026, 12, 1, horaFin, 0, 0, DateTimeKind.Utc)
    };
}
