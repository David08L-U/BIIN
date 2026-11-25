using Biin.Application.Interfaces;

namespace Biin.UnitTests.Tiempo;

public class ZonaYucatanTests
{
    [Fact]
    public void ALocal_resta_seis_horas_al_UTC()
    {
        var local = ZonaYucatan.ALocal(new DateTime(2026, 12, 7, 18, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2026, 12, 7, 12, 0, 0), local);
    }

    [Fact]
    public void Yucatan_no_tiene_horario_de_verano()
    {
        var julio = ZonaYucatan.ALocal(new DateTime(2026, 7, 1, 18, 0, 0, DateTimeKind.Utc));

        Assert.Equal(12, julio.Hour);
    }

    [Fact]
    public void InicioDelDiaUtc_es_las_seis_de_la_manana_UTC()
    {
        var inicio = ZonaYucatan.InicioDelDiaUtc(new DateOnly(2026, 12, 12));

        Assert.Equal(new DateTime(2026, 12, 12, 6, 0, 0, DateTimeKind.Utc), inicio);
        Assert.Equal(DateTimeKind.Utc, inicio.Kind);
    }
}
