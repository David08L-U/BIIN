using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Biin.Infrastructure.Persistence.Configurations;

public class RutaConfiguration : IEntityTypeConfiguration<Ruta>
{
    public void Configure(EntityTypeBuilder<Ruta> b)
    {
        b.ToTable("rutas");
        b.HasKey(x => x.IdRecurso);
        b.HasOne(x => x.Recurso).WithOne(r => r.Ruta).HasForeignKey<Ruta>(x => x.IdRecurso);
    }
}

public class RutaParadaConfiguration : IEntityTypeConfiguration<RutaParada>
{
    public void Configure(EntityTypeBuilder<RutaParada> b)
    {
        b.ToTable("ruta_parada");
        b.HasKey(x => new { x.IdRuta, x.Orden });
        b.HasOne(x => x.Ruta).WithMany(r => r.Paradas).HasForeignKey(x => x.IdRuta);
        b.HasOne(x => x.Ubicacion).WithMany().HasForeignKey(x => x.IdUbicacion);
    }
}

public class PuntoRecorridoConfiguration : IEntityTypeConfiguration<PuntoRecorrido>
{
    public void Configure(EntityTypeBuilder<PuntoRecorrido> b)
    {
        b.ToTable("puntos_recorrido");
        b.HasKey(x => new { x.IdRuta, x.Orden });
        b.HasOne(x => x.Ruta).WithMany(r => r.Puntos).HasForeignKey(x => x.IdRuta);
    }
}

public class HorarioRutaConfiguration : IEntityTypeConfiguration<HorarioRuta>
{
    public void Configure(EntityTypeBuilder<HorarioRuta> b)
    {
        b.ToTable("horarios_ruta");
        b.HasKey(x => x.IdHorario);
        b.HasOne(x => x.Ruta).WithMany(r => r.Horarios).HasForeignKey(x => x.IdRuta);
    }
}

public class TarifaConfiguration : IEntityTypeConfiguration<Tarifa>
{
    public void Configure(EntityTypeBuilder<Tarifa> b)
    {
        b.ToTable("tarifas");
        b.HasKey(x => x.IdTarifa);
        b.HasOne(x => x.Ruta).WithMany(r => r.Tarifas).HasForeignKey(x => x.IdRuta);
    }
}

public class UnidadConfiguration : IEntityTypeConfiguration<Unidad>
{
    public void Configure(EntityTypeBuilder<Unidad> b)
    {
        b.ToTable("unidades");
        b.HasKey(x => x.IdUnidad);
    }
}

public class SalidaConfiguration : IEntityTypeConfiguration<Salida>
{
    public void Configure(EntityTypeBuilder<Salida> b)
    {
        b.ToTable("salidas");
        b.HasKey(x => x.IdSalida);
        b.Property(x => x.Estado).HasConversion(new SnakeCaseEnumConverter<EstadoSalida>());
        b.HasOne(x => x.Ruta).WithMany(r => r.Salidas).HasForeignKey(x => x.IdRuta);
        b.HasOne(x => x.Unidad).WithMany().HasForeignKey(x => x.IdUnidad);
    }
}

public class OperadorRutaConfiguration : IEntityTypeConfiguration<OperadorRuta>
{
    public void Configure(EntityTypeBuilder<OperadorRuta> b)
    {
        b.ToTable("operador_ruta");
        b.HasKey(x => new { x.IdUsuario, x.IdRuta });
        b.HasOne(x => x.Usuario).WithMany(u => u.RutasOperadas).HasForeignKey(x => x.IdUsuario);
        b.HasOne(x => x.Ruta).WithMany(r => r.Operadores).HasForeignKey(x => x.IdRuta);
    }
}

public class ReporteCupoConfiguration : IEntityTypeConfiguration<ReporteCupo>
{
    public void Configure(EntityTypeBuilder<ReporteCupo> b)
    {
        b.ToTable("reportes_cupo");
        b.HasKey(x => x.IdReporte);
        b.Property(x => x.RegistradoEn).HasDefaultValueSql("now()");
        b.HasOne(x => x.Salida).WithMany(s => s.ReportesCupo).HasForeignKey(x => x.IdSalida);
        b.HasOne(x => x.Autor).WithMany().HasForeignKey(x => x.IdAutor);
    }
}
