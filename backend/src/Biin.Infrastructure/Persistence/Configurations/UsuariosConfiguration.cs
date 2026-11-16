using Biin.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Biin.Infrastructure.Persistence.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> b)
    {
        b.ToTable("usuarios");
        b.HasKey(x => x.IdUsuario);
        b.Property(x => x.FechaRegistro).HasDefaultValueSql("now()");
    }
}

public class RolConfiguration : IEntityTypeConfiguration<Rol>
{
    public void Configure(EntityTypeBuilder<Rol> b)
    {
        b.ToTable("roles");
        b.HasKey(x => x.IdRol);
    }
}

public class UsuarioRolConfiguration : IEntityTypeConfiguration<UsuarioRol>
{
    public void Configure(EntityTypeBuilder<UsuarioRol> b)
    {
        b.ToTable("usuario_rol");
        b.HasKey(x => new { x.IdUsuario, x.IdRol });
        b.HasOne(x => x.Usuario).WithMany(u => u.Roles).HasForeignKey(x => x.IdUsuario);
        b.HasOne(x => x.Rol).WithMany(r => r.Usuarios).HasForeignKey(x => x.IdRol);
    }
}

public class MunicipioConfiguration : IEntityTypeConfiguration<Municipio>
{
    public void Configure(EntityTypeBuilder<Municipio> b)
    {
        b.ToTable("municipios");
        b.HasKey(x => x.IdMunicipio);
    }
}

public class LocalidadConfiguration : IEntityTypeConfiguration<Localidad>
{
    public void Configure(EntityTypeBuilder<Localidad> b)
    {
        b.ToTable("localidades");
        b.HasKey(x => x.IdLocalidad);
        b.HasOne(x => x.Municipio).WithMany(m => m.Localidades).HasForeignKey(x => x.IdMunicipio);
    }
}

public class UbicacionConfiguration : IEntityTypeConfiguration<Ubicacion>
{
    public void Configure(EntityTypeBuilder<Ubicacion> b)
    {
        b.ToTable("ubicaciones");
        b.HasKey(x => x.IdUbicacion);
        b.HasOne(x => x.Localidad).WithMany(l => l.Ubicaciones).HasForeignKey(x => x.IdLocalidad);
    }
}
