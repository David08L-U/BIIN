using System.Linq.Expressions;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Biin.Domain.Vistas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Query;

namespace Biin.UnitTests.Fakes;

/// <summary>
/// Doble en memoria de <see cref="IAppDbContext"/> para probar servicios sin depender de PostgreSQL.
/// </summary>
public sealed class FakeAppDbContext : IAppDbContext
{
    private int _sigUsuario = 1;
    private long _sigBitacora = 1;

    public FakeDbSet<Usuario> UsuariosSet { get; } = new();
    public FakeDbSet<Rol> RolesSet { get; } = new();
    public FakeDbSet<UsuarioRol> UsuarioRolesSet { get; } = new();
    public FakeDbSet<Ruta> RutasSet { get; } = new();
    public FakeDbSet<OperadorRuta> OperadorRutasSet { get; } = new();
    public FakeDbSet<BitacoraAdmin> BitacoraAdminSet { get; } = new();

    public DbSet<Usuario> Usuarios => UsuariosSet;
    public DbSet<Rol> Roles => RolesSet;
    public DbSet<UsuarioRol> UsuarioRoles => UsuarioRolesSet;
    public FakeDbSet<RegistroPendiente> RegistrosPendientesSet { get; } = new();
    public DbSet<RegistroPendiente> RegistrosPendientes => RegistrosPendientesSet;
    public DbSet<Municipio> Municipios { get; } = new FakeDbSet<Municipio>();
    public DbSet<Localidad> Localidades { get; } = new FakeDbSet<Localidad>();
    public DbSet<Ubicacion> Ubicaciones { get; } = new FakeDbSet<Ubicacion>();
    public DbSet<Recurso> Recursos { get; } = new FakeDbSet<Recurso>();
    public DbSet<Categoria> Categorias { get; } = new FakeDbSet<Categoria>();
    public DbSet<RecursoCategoria> RecursoCategorias { get; } = new FakeDbSet<RecursoCategoria>();
    public DbSet<Fotografia> Fotografias { get; } = new FakeDbSet<Fotografia>();
    public DbSet<ColaboradorRecurso> ColaboradorRecursos { get; } = new FakeDbSet<ColaboradorRecurso>();
    public DbSet<Negocio> Negocios { get; } = new FakeDbSet<Negocio>();
    public DbSet<Evento> Eventos { get; } = new FakeDbSet<Evento>();
    public DbSet<Lugar> Lugares { get; } = new FakeDbSet<Lugar>();
    public DbSet<HorarioVisita> HorariosVisita { get; } = new FakeDbSet<HorarioVisita>();
    public DbSet<Ruta> Rutas => RutasSet;
    public DbSet<RutaParada> RutaParadas { get; } = new FakeDbSet<RutaParada>();
    public DbSet<PuntoRecorrido> PuntosRecorrido { get; } = new FakeDbSet<PuntoRecorrido>();
    public DbSet<HorarioRuta> HorariosRuta { get; } = new FakeDbSet<HorarioRuta>();
    public DbSet<Tarifa> Tarifas { get; } = new FakeDbSet<Tarifa>();
    public DbSet<Unidad> Unidades { get; } = new FakeDbSet<Unidad>();
    public DbSet<Salida> Salidas { get; } = new FakeDbSet<Salida>();
    public DbSet<OperadorRuta> OperadorRutas => OperadorRutasSet;
    public DbSet<ReporteCupo> ReportesCupo { get; } = new FakeDbSet<ReporteCupo>();
    public DbSet<Itinerario> Itinerarios { get; } = new FakeDbSet<Itinerario>();
    public DbSet<ActividadItinerario> ActividadesItinerario { get; } = new FakeDbSet<ActividadItinerario>();
    public DbSet<Favorito> Favoritos { get; } = new FakeDbSet<Favorito>();
    public DbSet<RecorridoSugerido> RecorridosSugeridos { get; } = new FakeDbSet<RecorridoSugerido>();
    public DbSet<EtapaRecorrido> EtapasRecorrido { get; } = new FakeDbSet<EtapaRecorrido>();
    public DbSet<BitacoraAdmin> BitacoraAdmin => BitacoraAdminSet;
    public DbSet<VRecursoPublicado> VRecursosPublicados { get; } = new FakeDbSet<VRecursoPublicado>();
    public DbSet<VParadaRuta> VParadasRuta { get; } = new FakeDbSet<VParadaRuta>();
    public DbSet<VCupoVigente> VCupoVigente { get; } = new FakeDbSet<VCupoVigente>();

    /// <summary>Devuelve el FakeDbSet del tipo indicado para sembrar o revisar datos en las pruebas.</summary>
    public FakeDbSet<T> Set<T>() where T : class =>
        GetType().GetProperties()
            .Where(p => p.PropertyType == typeof(DbSet<T>) || p.PropertyType == typeof(FakeDbSet<T>))
            .Select(p => p.GetValue(this))
            .OfType<FakeDbSet<T>>()
            .First();

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var u in UsuariosSet.Items)
        {
            if (u.IdUsuario == 0)
                u.IdUsuario = _sigUsuario++;
            else if (u.IdUsuario >= _sigUsuario)
                _sigUsuario = u.IdUsuario + 1;

            foreach (var ur in u.Roles)
            {
                ur.IdUsuario = u.IdUsuario;
                if (!UsuarioRolesSet.Items.Contains(ur))
                    UsuarioRolesSet.Items.Add(ur);
            }

            foreach (var or in u.RutasOperadas)
            {
                or.IdUsuario = u.IdUsuario;
                if (!OperadorRutasSet.Items.Contains(or))
                    OperadorRutasSet.Items.Add(or);
            }
        }

        var recursos = Set<Recurso>().Items;
        foreach (var r in recursos.Where(r => r.IdRecurso == 0))
        {
            r.IdRecurso = recursos.Max(x => x.IdRecurso) + 1;
            if (r.Negocio is not null) r.Negocio.IdRecurso = r.IdRecurso;
            if (r.Lugar is not null) r.Lugar.IdRecurso = r.IdRecurso;
            if (r.Evento is not null) r.Evento.IdRecurso = r.IdRecurso;
            foreach (var rc in r.Categorias) rc.IdRecurso = r.IdRecurso;
        }

        var fotos = Set<Fotografia>().Items;
        foreach (var f in fotos.Where(f => f.IdFotografia == 0))
            f.IdFotografia = fotos.Max(x => x.IdFotografia) + 1;

        var localidades = Set<Localidad>().Items;
        foreach (var l in localidades.Where(l => l.IdLocalidad == 0))
            l.IdLocalidad = localidades.Max(x => x.IdLocalidad) + 1;

        var ubicaciones = Set<Ubicacion>().Items;
        foreach (var u in ubicaciones.Where(u => u.IdUbicacion == 0))
            u.IdUbicacion = ubicaciones.Max(x => x.IdUbicacion) + 1;

        var itinerarios = Set<Itinerario>().Items;
        foreach (var i in itinerarios.Where(i => i.IdItinerario == 0))
            i.IdItinerario = itinerarios.Max(x => x.IdItinerario) + 1;

        var actividades = Set<ActividadItinerario>().Items;
        foreach (var a in actividades.Where(a => a.IdActividad == 0))
        {
            a.IdActividad = actividades.Max(x => x.IdActividad) + 1;
            if (a.Itinerario is not null)
                a.IdItinerario = a.Itinerario.IdItinerario;
        }

        foreach (var b in BitacoraAdminSet.Items)
        {
            if (b.IdBitacora == 0)
                b.IdBitacora = _sigBitacora++;
        }

        return Task.FromResult(1);
    }
}

public sealed class FakeDbSet<T> : DbSet<T>, IQueryable<T>, IAsyncEnumerable<T> where T : class
{
    private readonly List<T> _items = [];
    private readonly IQueryable<T> _queryable;

    public FakeDbSet()
    {
        _queryable = _items.AsQueryable();
    }

    public List<T> Items => _items;

    public override Microsoft.EntityFrameworkCore.Metadata.IEntityType EntityType => null!;

    public override EntityEntry<T> Add(T entity)
    {
        _items.Add(entity);
        return null!;
    }

    public override EntityEntry<T> Remove(T entity)
    {
        _items.Remove(entity);
        return null!;
    }

    Type IQueryable.ElementType => _queryable.ElementType;
    Expression IQueryable.Expression => _queryable.Expression;
    IQueryProvider IQueryable.Provider => new FakeAsyncQueryProvider<T>(_queryable.Provider);

    IEnumerator<T> IEnumerable<T>.GetEnumerator() => _items.GetEnumerator();
    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => _items.GetEnumerator();

    public override IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default) =>
        new FakeAsyncEnumerator<T>(_items.GetEnumerator());
}

internal sealed class FakeAsyncQueryProvider<TEntity>(IQueryProvider inner) : IAsyncQueryProvider
{
    public IQueryable CreateQuery(Expression expression) =>
        new FakeAsyncEnumerable<TEntity>(expression);

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression) =>
        new FakeAsyncEnumerable<TElement>(expression);

    public object? Execute(Expression expression) => inner.Execute(expression);

    public TResult Execute<TResult>(Expression expression) => inner.Execute<TResult>(expression);

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var tipoResultado = typeof(TResult).GetGenericArguments()[0];
        var resultado = typeof(IQueryProvider)
            .GetMethod(nameof(IQueryProvider.Execute), 1, [typeof(Expression)])!
            .MakeGenericMethod(tipoResultado)
            .Invoke(this, [expression]);

        return (TResult)typeof(Task)
            .GetMethod(nameof(Task.FromResult))!
            .MakeGenericMethod(tipoResultado)
            .Invoke(null, [resultado])!;
    }
}

internal sealed class FakeAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public FakeAsyncEnumerable(Expression expression) : base(expression) { }

    IQueryProvider IQueryable.Provider => new FakeAsyncQueryProvider<T>(this);

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default) =>
        new FakeAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
}

internal sealed class FakeAsyncEnumerator<T>(IEnumerator<T> inner) : IAsyncEnumerator<T>
{
    public T Current => inner.Current;
    public ValueTask DisposeAsync() { inner.Dispose(); return ValueTask.CompletedTask; }
    public ValueTask<bool> MoveNextAsync() => ValueTask.FromResult(inner.MoveNext());
}

public sealed class HashFalso : IHashContrasena
{
    public string Generar(string contrasena) => $"hash::{contrasena}";
    public bool Verificar(string contrasena, string hash) => hash == $"hash::{contrasena}";
}

/// <summary>Reloj fijo para pruebas; por defecto lunes 7 dic 2026, 12:00 en Yucatán (18:00 UTC).</summary>
public sealed class RelojFijo(DateTime? ahoraUtc = null) : IReloj
{
    public DateTime AhoraUtc { get; set; } = ahoraUtc ?? new DateTime(2026, 12, 7, 18, 0, 0, DateTimeKind.Utc);
}

public sealed class RevocacionFalsa : IRevocacionToken
{
    public HashSet<string> Revocados { get; } = [];
    public void Revocar(string jti, DateTime expiraEnUtc) => Revocados.Add(jti);
    public bool EstaRevocado(string jti) => Revocados.Contains(jti);
}
