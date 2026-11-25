using Biin.Domain.Enums;
using Biin.Domain.Vistas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Biin.Infrastructure.Persistence.Configurations;

// Las vistas se crean en database/schema/004_vistas.sql; aquí solo se leen (sin llave ni escritura).

public class VRecursoPublicadoConfiguration : IEntityTypeConfiguration<VRecursoPublicado>
{
    public void Configure(EntityTypeBuilder<VRecursoPublicado> b)
    {
        b.HasNoKey();
        b.ToView("v_recursos_publicados");
        b.Property(x => x.Tipo).HasConversion(new SnakeCaseEnumConverter<TipoRecurso>());
    }
}

public class VParadaRutaConfiguration : IEntityTypeConfiguration<VParadaRuta>
{
    public void Configure(EntityTypeBuilder<VParadaRuta> b)
    {
        b.HasNoKey();
        b.ToView("v_paradas_ruta");
    }
}

public class VCupoVigenteConfiguration : IEntityTypeConfiguration<VCupoVigente>
{
    public void Configure(EntityTypeBuilder<VCupoVigente> b)
    {
        b.HasNoKey();
        b.ToView("v_cupo_vigente");
        b.Property(x => x.EstadoSalida).HasConversion(new SnakeCaseEnumConverter<EstadoSalida>());
    }
}
