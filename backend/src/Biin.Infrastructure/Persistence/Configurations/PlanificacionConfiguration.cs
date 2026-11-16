using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Biin.Infrastructure.Persistence.Configurations;

public class ItinerarioConfiguration : IEntityTypeConfiguration<Itinerario>
{
    public void Configure(EntityTypeBuilder<Itinerario> b)
    {
        b.ToTable("itinerarios");
        b.HasKey(x => x.IdItinerario);
        b.Property(x => x.FechaCreacion).HasDefaultValueSql("now()");
        b.HasOne(x => x.Usuario).WithMany(u => u.Itinerarios).HasForeignKey(x => x.IdUsuario);
    }
}

public class ActividadItinerarioConfiguration : IEntityTypeConfiguration<ActividadItinerario>
{
    public void Configure(EntityTypeBuilder<ActividadItinerario> b)
    {
        b.ToTable("actividades_itinerario");
        b.HasKey(x => x.IdActividad);
        b.HasOne(x => x.Itinerario).WithMany(i => i.Actividades).HasForeignKey(x => x.IdItinerario);
        b.HasOne(x => x.Recurso).WithMany().HasForeignKey(x => x.IdRecurso);
    }
}

public class FavoritoConfiguration : IEntityTypeConfiguration<Favorito>
{
    public void Configure(EntityTypeBuilder<Favorito> b)
    {
        b.ToTable("favoritos");
        b.HasKey(x => new { x.IdUsuario, x.IdRecurso });
        b.Property(x => x.FechaGuardado).HasDefaultValueSql("now()");
        b.HasOne(x => x.Usuario).WithMany(u => u.Favoritos).HasForeignKey(x => x.IdUsuario);
        b.HasOne(x => x.Recurso).WithMany().HasForeignKey(x => x.IdRecurso);
    }
}

public class RecorridoSugeridoConfiguration : IEntityTypeConfiguration<RecorridoSugerido>
{
    public void Configure(EntityTypeBuilder<RecorridoSugerido> b)
    {
        b.ToTable("recorridos_sugeridos");
        b.HasKey(x => x.IdRecorrido);
        b.Property(x => x.EstadoPublicacion).HasConversion(new SnakeCaseEnumConverter<EstadoPublicacion>());
        b.Property(x => x.ActualizadoEn).HasDefaultValueSql("now()");
        b.HasOne(x => x.LocalidadBase).WithMany().HasForeignKey(x => x.IdLocalidadBase);
    }
}

public class EtapaRecorridoConfiguration : IEntityTypeConfiguration<EtapaRecorrido>
{
    public void Configure(EntityTypeBuilder<EtapaRecorrido> b)
    {
        b.ToTable("etapas_recorrido");
        b.HasKey(x => new { x.IdRecorrido, x.Orden });
        b.HasOne(x => x.Recorrido).WithMany(r => r.Etapas).HasForeignKey(x => x.IdRecorrido);
        b.HasOne(x => x.Recurso).WithMany().HasForeignKey(x => x.IdRecurso);
    }
}

public class BitacoraAdminConfiguration : IEntityTypeConfiguration<BitacoraAdmin>
{
    public void Configure(EntityTypeBuilder<BitacoraAdmin> b)
    {
        b.ToTable("bitacora_admin");
        b.HasKey(x => x.IdBitacora);
        b.Property(x => x.Detalle).HasColumnType("jsonb");
        b.Property(x => x.Fecha).HasDefaultValueSql("now()");
        b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario);
    }
}
