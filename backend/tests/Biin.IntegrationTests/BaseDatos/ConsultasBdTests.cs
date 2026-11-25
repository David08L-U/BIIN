using Biin.Application.Consultas;
using Biin.Domain.Enums;
using Biin.Domain.Vistas;
using Microsoft.EntityFrameworkCore;

namespace Biin.IntegrationTests.BaseDatos;

/// <summary>
/// Consultas de EF Core contra la base con la demo de Homún cargada (crear_bd.ps1 -Demo).
/// </summary>
public class ConsultasBdTests
{
    [FactBd]
    public async Task Normalizar_se_traduce_a_f_normalizar_y_encuentra_sin_acentos()
    {
        await using var db = BdPruebas.CrearContexto();
        var buscado = FuncionesBd.NormalizarTexto("HOMUN");

        var localidades = await db.Localidades
            .Where(l => FuncionesBd.Normalizar(l.Nombre).Contains(buscado))
            .Select(l => l.Nombre)
            .ToListAsync();

        Assert.Contains("Homún", localidades);
        var sql = db.Localidades.Where(l => FuncionesBd.Normalizar(l.Nombre).Contains(buscado)).ToQueryString();
        Assert.Contains("f_normalizar", sql);
    }

    [FactBd]
    public async Task Vista_de_recursos_publicados_no_incluye_pendientes()
    {
        await using var db = BdPruebas.CrearContexto();

        var titulos = await db.VRecursosPublicados.Select(r => r.Titulo).ToListAsync();
        var pendientes = await db.Recursos
            .Where(r => r.EstadoPublicacion != EstadoPublicacion.Publicado)
            .Select(r => r.Titulo)
            .ToListAsync();

        Assert.NotEmpty(titulos);
        Assert.DoesNotContain(titulos, t => pendientes.Contains(t));
    }

    [FactBd]
    public async Task Vista_de_paradas_devuelve_la_ruta_demo_en_orden()
    {
        await using var db = BdPruebas.CrearContexto();

        var paradas = await db.VParadasRuta
            .Where(p => p.Codigo == "DEMO-MER-HOM")
            .OrderBy(p => p.Orden)
            .Select(p => p.Localidad)
            .ToListAsync();

        Assert.Equal(["Mérida", "Kanasín", "Acanceh", "Cuzamá", "Homún"], paradas);
    }

    [FactBd]
    public async Task Vista_de_cupo_marca_no_confirmado_sin_reporte_y_convierte_el_estado_de_salida()
    {
        await using var db = BdPruebas.CrearContexto();

        var cupos = await db.VCupoVigente.Take(20).ToListAsync();

        Assert.NotEmpty(cupos);
        Assert.All(cupos, c => Assert.True(
            c.EstadoCupo is VCupoVigente.EstadoVigente or VCupoVigente.EstadoNoConfirmado));
        Assert.All(cupos.Where(c => c.EstadoCupo == VCupoVigente.EstadoNoConfirmado),
            c => Assert.Null(c.AsientosDisponibles));
        Assert.All(cupos, c => Assert.True(Enum.IsDefined(c.EstadoSalida)));
    }

    [FactBd]
    public async Task Enums_en_snake_case_se_leen_desde_la_base()
    {
        await using var db = BdPruebas.CrearContexto();

        var cancelados = await db.Eventos.CountAsync(e => e.EstadoEvento == EstadoEvento.Cancelado);
        var tipos = await db.Recursos.Select(r => r.Tipo).Distinct().ToListAsync();

        Assert.True(cancelados >= 1, "La demo debe tener un evento cancelado.");
        Assert.Contains(TipoRecurso.Ruta, tipos);
        Assert.Contains(TipoRecurso.Lugar, tipos);
    }
}
