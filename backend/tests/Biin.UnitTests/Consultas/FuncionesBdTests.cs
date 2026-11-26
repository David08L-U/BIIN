using Biin.Application.Consultas;

namespace Biin.UnitTests.Consultas;

public class FuncionesBdTests
{
    [Theory]
    [InlineData("Homún", "homun")]
    [InlineData("MÉRIDA", "merida")]
    [InlineData("Cuzamá", "cuzama")]
    [InlineData("Peña Ñandú", "pena nandu")]
    [InlineData("sin acentos", "sin acentos")]
    public void NormalizarTexto_quita_acentos_y_pasa_a_minusculas(string entrada, string esperado)
    {
        Assert.Equal(esperado, FuncionesBd.NormalizarTexto(entrada));
        Assert.Equal(esperado, FuncionesBd.Normalizar(entrada));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void NormalizarTexto_con_vacio_devuelve_cadena_vacia(string? entrada)
    {
        Assert.Equal(string.Empty, FuncionesBd.NormalizarTexto(entrada));
    }

    [Fact]
    public void Normalizar_funciona_dentro_de_consultas_en_memoria()
    {
        var localidades = new[] { "Homún", "Mérida", "Kanasín" }.AsQueryable();
        var buscado = FuncionesBd.NormalizarTexto("HOMUN");

        var encontradas = localidades.Where(l => FuncionesBd.Normalizar(l).Contains(buscado)).ToList();

        Assert.Equal(["Homún"], encontradas);
    }
}
