using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Biin.Infrastructure.Persistence.Configurations;

public class RecursoConfiguration : IEntityTypeConfiguration<Recurso>
{
    public void Configure(EntityTypeBuilder<Recurso> b)
    {
        b.ToTable("recursos");
        b.HasKey(x => x.IdRecurso);
        b.Property(x => x.Tipo).HasConversion(new SnakeCaseEnumConverter<TipoRecurso>());
        b.Property(x => x.EstadoPublicacion).HasConversion(new SnakeCaseEnumConverter<EstadoPublicacion>());
        b.Property(x => x.ActualizadoEn).HasDefaultValueSql("now()");
        b.HasOne(x => x.Creador).WithMany().HasForeignKey(x => x.IdCreador);
        b.HasOne(x => x.Revisor).WithMany().HasForeignKey(x => x.IdRevisor);
    }
}

public class CategoriaConfiguration : IEntityTypeConfiguration<Categoria>
{
    public void Configure(EntityTypeBuilder<Categoria> b)
    {
        b.ToTable("categorias");
        b.HasKey(x => x.IdCategoria);
    }
}

public class RecursoCategoriaConfiguration : IEntityTypeConfiguration<RecursoCategoria>
{
    public void Configure(EntityTypeBuilder<RecursoCategoria> b)
    {
        b.ToTable("recurso_categoria");
        b.HasKey(x => new { x.IdRecurso, x.IdCategoria });
        b.HasOne(x => x.Recurso).WithMany(r => r.Categorias).HasForeignKey(x => x.IdRecurso);
        b.HasOne(x => x.Categoria).WithMany(c => c.Recursos).HasForeignKey(x => x.IdCategoria);
    }
}

public class FotografiaConfiguration : IEntityTypeConfiguration<Fotografia>
{
    public void Configure(EntityTypeBuilder<Fotografia> b)
    {
        b.ToTable("fotografias");
        b.HasKey(x => x.IdFotografia);
        b.HasOne(x => x.Recurso).WithMany(r => r.Fotografias).HasForeignKey(x => x.IdRecurso);
    }
}

public class ColaboradorRecursoConfiguration : IEntityTypeConfiguration<ColaboradorRecurso>
{
    public void Configure(EntityTypeBuilder<ColaboradorRecurso> b)
    {
        b.ToTable("colaborador_recurso");
        b.HasKey(x => new { x.IdUsuario, x.IdRecurso });
        b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario);
        b.HasOne(x => x.Recurso).WithMany().HasForeignKey(x => x.IdRecurso);
    }
}

public class NegocioConfiguration : IEntityTypeConfiguration<Negocio>
{
    public void Configure(EntityTypeBuilder<Negocio> b)
    {
        b.ToTable("negocios");
        b.HasKey(x => x.IdRecurso);
        b.HasOne(x => x.Recurso).WithOne(r => r.Negocio).HasForeignKey<Negocio>(x => x.IdRecurso);
        b.HasOne(x => x.Ubicacion).WithMany().HasForeignKey(x => x.IdUbicacion);
    }
}

public class EventoConfiguration : IEntityTypeConfiguration<Evento>
{
    public void Configure(EntityTypeBuilder<Evento> b)
    {
        b.ToTable("eventos");
        b.HasKey(x => x.IdRecurso);
        b.Property(x => x.EstadoEvento).HasConversion(new SnakeCaseEnumConverter<EstadoEvento>());
        b.HasOne(x => x.Recurso).WithOne(r => r.Evento).HasForeignKey<Evento>(x => x.IdRecurso);
        b.HasOne(x => x.Ubicacion).WithMany().HasForeignKey(x => x.IdUbicacion);
    }
}

public class LugarConfiguration : IEntityTypeConfiguration<Lugar>
{
    public void Configure(EntityTypeBuilder<Lugar> b)
    {
        b.ToTable("lugares");
        b.HasKey(x => x.IdRecurso);
        b.HasOne(x => x.Recurso).WithOne(r => r.Lugar).HasForeignKey<Lugar>(x => x.IdRecurso);
        b.HasOne(x => x.Ubicacion).WithMany().HasForeignKey(x => x.IdUbicacion);
    }
}

public class HorarioVisitaConfiguration : IEntityTypeConfiguration<HorarioVisita>
{
    public void Configure(EntityTypeBuilder<HorarioVisita> b)
    {
        b.ToTable("horarios_visita");
        b.HasKey(x => x.IdHorario);
        b.HasOne(x => x.Recurso).WithMany(r => r.HorariosVisita).HasForeignKey(x => x.IdRecurso);
    }
}
