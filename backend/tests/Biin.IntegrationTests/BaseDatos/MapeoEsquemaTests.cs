using System.Reflection;
using Biin.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Biin.IntegrationTests.BaseDatos;

/// <summary>
/// Comprueba que cada DbSet de IAppDbContext coincide con el esquema real de database/:
/// si una columna o tabla cambia de nombre en SQL y no en EF Core, esta prueba falla.
/// </summary>
public class MapeoEsquemaTests
{
    public static TheoryData<string> DbSets()
    {
        var datos = new TheoryData<string>();
        foreach (var p in typeof(IAppDbContext).GetProperties()
                     .Where(p => p.PropertyType.IsGenericType &&
                                 p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>)))
            datos.Add(p.Name);
        return datos;
    }

    [TheoryBd]
    [MemberData(nameof(DbSets))]
    public async Task Cada_DbSet_se_puede_consultar_contra_PostgreSQL(string nombreDbSet)
    {
        await using var db = BdPruebas.CrearContexto();
        var propiedad = typeof(IAppDbContext).GetProperty(nombreDbSet)!;
        var dbSet = propiedad.GetValue(db)!;
        var tipoEntidad = propiedad.PropertyType.GetGenericArguments()[0];

        // Equivale a db.<DbSet>.Take(5).ToListAsync(): selecciona todas las columnas mapeadas
        var tomar = typeof(Queryable).GetMethods()
            .First(m => m.Name == nameof(Queryable.Take) && m.GetParameters()[1].ParameterType == typeof(int))
            .MakeGenericMethod(tipoEntidad);
        var consulta = tomar.Invoke(null, [dbSet, 5])!;
        var aLista = typeof(EntityFrameworkQueryableExtensions)
            .GetMethod(nameof(EntityFrameworkQueryableExtensions.ToListAsync))!
            .MakeGenericMethod(tipoEntidad);

        var tarea = (Task)aLista.Invoke(null, [consulta, CancellationToken.None])!;
        await tarea;
    }
}
