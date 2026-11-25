using Biin.Domain.Entities;
using Biin.Domain.Vistas;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Interfaces;

/// <summary>Acceso a datos que usan los servicios; lo implementa Infrastructure.</summary>
public interface IAppDbContext
{
    DbSet<Usuario> Usuarios { get; }
    DbSet<Rol> Roles { get; }
    DbSet<UsuarioRol> UsuarioRoles { get; }
    DbSet<Municipio> Municipios { get; }
    DbSet<Localidad> Localidades { get; }
    DbSet<Ubicacion> Ubicaciones { get; }

    DbSet<Recurso> Recursos { get; }
    DbSet<Categoria> Categorias { get; }
    DbSet<RecursoCategoria> RecursoCategorias { get; }
    DbSet<Fotografia> Fotografias { get; }
    DbSet<ColaboradorRecurso> ColaboradorRecursos { get; }
    DbSet<Negocio> Negocios { get; }
    DbSet<Evento> Eventos { get; }
    DbSet<Lugar> Lugares { get; }
    DbSet<HorarioVisita> HorariosVisita { get; }

    DbSet<Ruta> Rutas { get; }
    DbSet<RutaParada> RutaParadas { get; }
    DbSet<PuntoRecorrido> PuntosRecorrido { get; }
    DbSet<HorarioRuta> HorariosRuta { get; }
    DbSet<Tarifa> Tarifas { get; }
    DbSet<Unidad> Unidades { get; }
    DbSet<Salida> Salidas { get; }
    DbSet<OperadorRuta> OperadorRutas { get; }
    DbSet<ReporteCupo> ReportesCupo { get; }

    DbSet<Itinerario> Itinerarios { get; }
    DbSet<ActividadItinerario> ActividadesItinerario { get; }
    DbSet<Favorito> Favoritos { get; }

    DbSet<RecorridoSugerido> RecorridosSugeridos { get; }
    DbSet<EtapaRecorrido> EtapasRecorrido { get; }
    DbSet<BitacoraAdmin> BitacoraAdmin { get; }

    // Vistas de solo lectura (database/schema/004_vistas.sql)
    DbSet<VRecursoPublicado> VRecursosPublicados { get; }
    DbSet<VParadaRuta> VParadasRuta { get; }
    DbSet<VCupoVigente> VCupoVigente { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
