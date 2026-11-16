using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Biin.Infrastructure.Persistence;

/// <summary>
/// Acceso a PostgreSQL. El esquema lo definen los scripts de database/,
/// así que aquí solo se mapea; no se usan migraciones para crear tablas.
/// </summary>
public class BiinDbContext(DbContextOptions<BiinDbContext> options) : DbContext(options), IAppDbContext
{
    // Usuarios y ubicación geográfica
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<UsuarioRol> UsuarioRoles => Set<UsuarioRol>();
    public DbSet<Municipio> Municipios => Set<Municipio>();
    public DbSet<Localidad> Localidades => Set<Localidad>();
    public DbSet<Ubicacion> Ubicaciones => Set<Ubicacion>();

    // Contenidos
    public DbSet<Recurso> Recursos => Set<Recurso>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<RecursoCategoria> RecursoCategorias => Set<RecursoCategoria>();
    public DbSet<Fotografia> Fotografias => Set<Fotografia>();
    public DbSet<ColaboradorRecurso> ColaboradorRecursos => Set<ColaboradorRecurso>();
    public DbSet<Negocio> Negocios => Set<Negocio>();
    public DbSet<Evento> Eventos => Set<Evento>();
    public DbSet<Lugar> Lugares => Set<Lugar>();
    public DbSet<HorarioVisita> HorariosVisita => Set<HorarioVisita>();

    // Transporte
    public DbSet<Ruta> Rutas => Set<Ruta>();
    public DbSet<RutaParada> RutaParadas => Set<RutaParada>();
    public DbSet<PuntoRecorrido> PuntosRecorrido => Set<PuntoRecorrido>();
    public DbSet<HorarioRuta> HorariosRuta => Set<HorarioRuta>();
    public DbSet<Tarifa> Tarifas => Set<Tarifa>();
    public DbSet<Unidad> Unidades => Set<Unidad>();
    public DbSet<Salida> Salidas => Set<Salida>();
    public DbSet<OperadorRuta> OperadorRutas => Set<OperadorRuta>();
    public DbSet<ReporteCupo> ReportesCupo => Set<ReporteCupo>();

    // Planificación de viaje
    public DbSet<Itinerario> Itinerarios => Set<Itinerario>();
    public DbSet<ActividadItinerario> ActividadesItinerario => Set<ActividadItinerario>();
    public DbSet<Favorito> Favoritos => Set<Favorito>();

    // Ampliaciones del MVP
    public DbSet<RecorridoSugerido> RecorridosSugeridos => Set<RecorridoSugerido>();
    public DbSet<EtapaRecorrido> EtapasRecorrido => Set<EtapaRecorrido>();
    public DbSet<BitacoraAdmin> BitacoraAdmin => Set<BitacoraAdmin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BiinDbContext).Assembly);
    }
}
