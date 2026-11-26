using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Vistas;

namespace Biin.UnitTests.Fakes;

/// <summary>
/// Datos ficticios en memoria con las navegaciones ya conectadas (EF Core no las arregla en el fake).
/// Fecha de referencia: lunes 7 dic 2026, 12:00 en Yucatán (ver <see cref="RelojFijo"/>).
/// </summary>
public sealed class DatosPrueba
{
    public Usuario Creador { get; } = new() { IdUsuario = 100, Nombre = "Equipo BIIN", Correo = "equipo@biin.test" };

    public Municipio Homun { get; } = new() { IdMunicipio = 1, Codigo = "036", Nombre = "Homún" };
    public Municipio Merida { get; } = new() { IdMunicipio = 2, Codigo = "050", Nombre = "Mérida" };
    public Localidad LocHomun { get; private set; } = null!;
    public Localidad LocMerida { get; private set; } = null!;
    public Ubicacion UbHomun { get; private set; } = null!;
    public Ubicacion UbHomunCenote { get; private set; } = null!;
    public Ubicacion UbMerida { get; private set; } = null!;

    public Categoria ComidaRegional { get; } = new() { IdCategoria = 1, Nombre = "Comida regional" };
    public Categoria Cenote { get; } = new() { IdCategoria = 2, Nombre = "Cenote" };
    public Categoria Baile { get; } = new() { IdCategoria = 3, Nombre = "Baile" };
    public Categoria Museo { get; } = new() { IdCategoria = 4, Nombre = "Museo" };

    public Recurso CocinaHomun { get; private set; } = null!;
    public Recurso MarisqueriaMerida { get; private set; } = null!;
    public Recurso NegocioPendiente { get; private set; } = null!;
    public Recurso CenotePublicado { get; private set; } = null!;
    public Recurso CenoteArchivado { get; private set; } = null!;
    public Recurso Vaqueria { get; private set; } = null!;
    public Recurso ConciertoCancelado { get; private set; } = null!;
    public Recurso FeriaPasada { get; private set; } = null!;
    public Recurso RutaMeridaHomun { get; private set; } = null!;

    public static DatosPrueba Sembrar(FakeAppDbContext db)
    {
        var d = new DatosPrueba();
        d.Construir();
        d.Guardar(db);
        return d;
    }

    private void Construir()
    {
        LocHomun = new Localidad { IdLocalidad = 1, IdMunicipio = 1, Nombre = "Homún", Municipio = Homun };
        LocMerida = new Localidad { IdLocalidad = 2, IdMunicipio = 2, Nombre = "Mérida", Municipio = Merida };
        Homun.Localidades.Add(LocHomun);
        Merida.Localidades.Add(LocMerida);

        UbHomun = Ubicacion(1, LocHomun, "Plaza principal", 20.739200m, -89.285500m);
        UbHomunCenote = Ubicacion(2, LocHomun, "Camino a los cenotes", 20.722000m, -89.292000m);
        UbMerida = Ubicacion(3, LocMerida, "Centro", 20.967400m, -89.623700m);

        CocinaHomun = Recurso(10, TipoRecurso.Negocio, "Cocina económica Doña Mary", EstadoPublicacion.Publicado, ComidaRegional);
        CocinaHomun.Negocio = new Negocio
        {
            IdRecurso = 10, Recurso = CocinaHomun, IdUbicacion = UbHomun.IdUbicacion, Ubicacion = UbHomun,
            Telefono = "9990000000", PrecioMinimoAprox = 60, PrecioMaximoAprox = 150
        };
        // Lunes a sábado de 08:00 a 17:00
        for (short dia = 1; dia <= 6; dia++)
            CocinaHomun.HorariosVisita.Add(new HorarioVisita
            {
                IdHorario = dia, IdRecurso = 10, Recurso = CocinaHomun, DiaSemana = dia,
                HoraApertura = new TimeOnly(8, 0), HoraCierre = new TimeOnly(17, 0)
            });
        CocinaHomun.Fotografias.Add(new Fotografia { IdFotografia = 2, IdRecurso = 10, Recurso = CocinaHomun, Orden = 2, UrlArchivo = "/fotos/cocina-2.jpg", TextoAlternativo = "Platillos" });
        CocinaHomun.Fotografias.Add(new Fotografia { IdFotografia = 1, IdRecurso = 10, Recurso = CocinaHomun, Orden = 1, UrlArchivo = "/fotos/cocina-1.jpg", TextoAlternativo = "Fachada" });

        MarisqueriaMerida = Recurso(11, TipoRecurso.Negocio, "Marisquería del Centro", EstadoPublicacion.Publicado, ComidaRegional);
        MarisqueriaMerida.Negocio = new Negocio
        {
            IdRecurso = 11, Recurso = MarisqueriaMerida, IdUbicacion = UbMerida.IdUbicacion, Ubicacion = UbMerida,
            PrecioMinimoAprox = 200, PrecioMaximoAprox = 450
        };

        NegocioPendiente = Recurso(12, TipoRecurso.Negocio, "Taquería sin revisar", EstadoPublicacion.Pendiente, ComidaRegional);
        NegocioPendiente.Negocio = new Negocio { IdRecurso = 12, Recurso = NegocioPendiente, IdUbicacion = UbHomun.IdUbicacion, Ubicacion = UbHomun };

        CenotePublicado = Recurso(20, TipoRecurso.Lugar, "Cenote Santa Rosa", EstadoPublicacion.Publicado, Cenote);
        CenotePublicado.Lugar = new Lugar
        {
            IdRecurso = 20, Recurso = CenotePublicado, IdUbicacion = UbHomunCenote.IdUbicacion, Ubicacion = UbHomunCenote,
            CostoAcceso = 50, CondicionesAcceso = "Chaleco obligatorio"
        };
        CenotePublicado.HorariosVisita.Add(new HorarioVisita
        {
            IdHorario = 20, IdRecurso = 20, Recurso = CenotePublicado, DiaSemana = 1,
            HoraApertura = new TimeOnly(9, 0), HoraCierre = new TimeOnly(17, 0)
        });

        CenoteArchivado = Recurso(21, TipoRecurso.Lugar, "Cenote cerrado", EstadoPublicacion.Archivado, Cenote);
        CenoteArchivado.Lugar = new Lugar { IdRecurso = 21, Recurso = CenoteArchivado, IdUbicacion = UbHomunCenote.IdUbicacion, Ubicacion = UbHomunCenote };

        // Sábado 12 dic 2026 19:00-23:00 en Yucatán = domingo 13 dic 01:00-05:00 UTC
        Vaqueria = Recurso(30, TipoRecurso.Evento, "Vaquería en la plaza", EstadoPublicacion.Publicado, Baile);
        Vaqueria.Evento = Evento(Vaqueria, UbHomun, new DateTime(2026, 12, 13, 1, 0, 0, DateTimeKind.Utc), 4, EstadoEvento.Programado, 0);

        // Jueves 10 dic 2026 20:00 en Yucatán
        ConciertoCancelado = Recurso(31, TipoRecurso.Evento, "Concierto en Mérida", EstadoPublicacion.Publicado, Baile);
        ConciertoCancelado.Evento = Evento(ConciertoCancelado, UbMerida, new DateTime(2026, 12, 11, 2, 0, 0, DateTimeKind.Utc), 2, EstadoEvento.Cancelado, 100);

        // 1 dic 2026: ya pasó respecto a la fecha de referencia
        FeriaPasada = Recurso(32, TipoRecurso.Evento, "Feria de diciembre", EstadoPublicacion.Publicado, Baile);
        FeriaPasada.Evento = Evento(FeriaPasada, UbHomun, new DateTime(2026, 12, 1, 18, 0, 0, DateTimeKind.Utc), 3, EstadoEvento.Finalizado, 20);

        RutaMeridaHomun = Recurso(40, TipoRecurso.Ruta, "Mérida a Homún", EstadoPublicacion.Publicado);
        RutaMeridaHomun.Ruta = new Ruta { IdRecurso = 40, Recurso = RutaMeridaHomun, Codigo = "MER-HOM" };
    }

    private void Guardar(FakeAppDbContext db)
    {
        db.UsuariosSet.Items.Add(Creador);
        db.Set<Municipio>().Items.AddRange([Homun, Merida]);
        db.Set<Localidad>().Items.AddRange([LocHomun, LocMerida]);
        db.Set<Ubicacion>().Items.AddRange([UbHomun, UbHomunCenote, UbMerida]);
        db.Set<Categoria>().Items.AddRange([ComidaRegional, Cenote, Baile, Museo]);

        var recursos = new[]
        {
            CocinaHomun, MarisqueriaMerida, NegocioPendiente, CenotePublicado, CenoteArchivado,
            Vaqueria, ConciertoCancelado, FeriaPasada, RutaMeridaHomun
        };
        db.Set<Recurso>().Items.AddRange(recursos);
        foreach (var r in recursos)
        {
            if (r.Negocio is not null) db.Set<Negocio>().Items.Add(r.Negocio);
            if (r.Lugar is not null) db.Set<Lugar>().Items.Add(r.Lugar);
            if (r.Evento is not null) db.Set<Evento>().Items.Add(r.Evento);
            if (r.Ruta is not null) db.RutasSet.Items.Add(r.Ruta);
            db.Set<RecursoCategoria>().Items.AddRange(r.Categorias);
            db.Set<Fotografia>().Items.AddRange(r.Fotografias);
            db.Set<HorarioVisita>().Items.AddRange(r.HorariosVisita);

            if (r.EstadoPublicacion == EstadoPublicacion.Publicado)
            {
                var ub = r.Negocio?.Ubicacion ?? r.Lugar?.Ubicacion ?? r.Evento?.Ubicacion ?? UbMerida;
                db.Set<VRecursoPublicado>().Items.Add(new VRecursoPublicado
                {
                    IdRecurso = r.IdRecurso, Tipo = r.Tipo, Titulo = r.Titulo, Descripcion = r.Descripcion,
                    ActualizadoEn = r.ActualizadoEn, IdUbicacion = ub.IdUbicacion, Latitud = ub.Latitud,
                    Longitud = ub.Longitud, IdLocalidad = ub.IdLocalidad, Localidad = ub.Localidad.Nombre,
                    IdMunicipio = ub.Localidad.IdMunicipio, Municipio = ub.Localidad.Municipio.Nombre
                });
            }
        }
    }

    private static Ubicacion Ubicacion(int id, Localidad localidad, string referencia, decimal lat, decimal lon)
    {
        var ub = new Ubicacion
        {
            IdUbicacion = id, IdLocalidad = localidad.IdLocalidad, Localidad = localidad,
            DireccionReferencia = referencia, Latitud = lat, Longitud = lon
        };
        localidad.Ubicaciones.Add(ub);
        return ub;
    }

    private Recurso Recurso(int id, TipoRecurso tipo, string titulo, EstadoPublicacion estado, params Categoria[] categorias)
    {
        var r = new Recurso
        {
            IdRecurso = id, Tipo = tipo, Titulo = titulo, Descripcion = $"Descripción de {titulo}",
            EstadoPublicacion = estado, IdCreador = Creador.IdUsuario, Creador = Creador,
            ActualizadoEn = new DateTime(2026, 12, 1, 12, 0, 0, DateTimeKind.Utc)
        };
        foreach (var c in categorias)
        {
            var enlace = new RecursoCategoria { IdRecurso = id, Recurso = r, IdCategoria = c.IdCategoria, Categoria = c };
            r.Categorias.Add(enlace);
            c.Recursos.Add(enlace);
        }
        return r;
    }

    private static Evento Evento(Recurso r, Ubicacion ub, DateTime inicioUtc, int horas, EstadoEvento estado, decimal costo) => new()
    {
        IdRecurso = r.IdRecurso, Recurso = r, IdUbicacion = ub.IdUbicacion, Ubicacion = ub,
        Inicio = inicioUtc, Fin = inicioUtc.AddHours(horas), EstadoEvento = estado, CostoEntrada = costo,
        ContactoOrganizador = "Organización ficticia"
    };
}
