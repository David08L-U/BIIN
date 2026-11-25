using Biin.Domain.Entities;

namespace Biin.UnitTests.Domain;

public class HorarioVisitaTests
{
    // 7 dic 2026 es lunes (DiaSemana = 1)
    private static readonly DateTime Lunes = new(2026, 12, 7);

    private static HorarioVisita Horario(short dia, string apertura, string cierre) => new()
    {
        DiaSemana = dia,
        HoraApertura = TimeOnly.Parse(apertura),
        HoraCierre = TimeOnly.Parse(cierre)
    };

    [Theory]
    [InlineData("08:59", false)]
    [InlineData("09:00", true)]
    [InlineData("16:59", true)]
    [InlineData("17:00", false)]
    public void Horario_normal_cubre_desde_apertura_hasta_antes_del_cierre(string hora, bool esperado)
    {
        var horario = Horario(1, "09:00", "17:00");

        Assert.Equal(esperado, horario.CubreMomento(Lunes.Add(TimeSpan.Parse(hora))));
    }

    [Fact]
    public void Horario_de_otro_dia_no_cubre()
    {
        var martes = Horario(2, "09:00", "17:00");

        Assert.False(martes.CubreMomento(Lunes.AddHours(10)));
    }

    [Theory]
    [InlineData(0, "23:00", true)]   // lunes 23:00
    [InlineData(1, "01:30", true)]   // martes 01:30, antes del cierre
    [InlineData(1, "02:00", false)]  // martes al cierre
    [InlineData(0, "17:00", false)]  // lunes antes de abrir
    public void Horario_que_cruza_medianoche_sigue_abierto_al_dia_siguiente(int diasDespues, string hora, bool esperado)
    {
        var horario = Horario(1, "18:00", "02:00");

        Assert.True(horario.CruzaMedianoche);
        Assert.Equal(esperado, horario.CubreMomento(Lunes.AddDays(diasDespues).Add(TimeSpan.Parse(hora))));
    }

    [Fact]
    public void Sabado_que_cruza_medianoche_cubre_el_domingo()
    {
        var sabado = Horario(6, "20:00", "03:00");
        var domingoMadrugada = new DateTime(2026, 12, 13, 1, 0, 0);

        Assert.True(sabado.CubreMomento(domingoMadrugada));
    }

    [Fact]
    public void EstaAbierto_revisa_todos_los_horarios()
    {
        var horarios = new[] { Horario(1, "08:00", "12:00"), Horario(1, "16:00", "20:00") };

        Assert.True(HorarioVisita.EstaAbierto(horarios, Lunes.AddHours(17)));
        Assert.False(HorarioVisita.EstaAbierto(horarios, Lunes.AddHours(14)));
        Assert.False(HorarioVisita.EstaAbierto([], Lunes.AddHours(10)));
    }
}
