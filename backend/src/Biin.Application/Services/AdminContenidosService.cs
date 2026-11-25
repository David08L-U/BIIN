using Biin.Application.Consultas;
using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Comun;
using Biin.Application.Interfaces;
using Biin.Application.Validators;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>
/// Gestión de negocios, eventos y lugares por el administrador (CU-12, RF12, paquete 17.1).
/// Todo contenido nuevo nace "pendiente"; se retira archivándolo, nunca se borra (ARQUITECTURA §4.6).
/// Cada cambio queda en la bitácora administrativa (17.1.5).
/// </summary>
public class AdminContenidosService(IAppDbContext db, IBitacoraAdmin bitacora, IReloj reloj)
{
    public async Task<PaginaResultado<ContenidoAdminDto>> ListarAsync(
        FiltroContenidosAdminRequest filtro,
        CancellationToken ct = default)
    {
        var (pagina, tamano) = Paginacion.Normalizar(filtro.Pagina, filtro.Tamano);
        var consulta = ConsultaCompleta().AsNoTracking().Where(r => r.Tipo != TipoRecurso.Ruta);

        if (filtro.Tipo.HasValue)
            consulta = consulta.Where(r => r.Tipo == filtro.Tipo.Value);
        if (filtro.Estado.HasValue)
            consulta = consulta.Where(r => r.EstadoPublicacion == filtro.Estado.Value);

        var texto = FuncionesBd.NormalizarTexto(filtro.Busqueda?.Trim());
        if (texto.Length > 0)
            consulta = consulta.Where(r => FuncionesBd.Normalizar(r.Titulo).Contains(texto));

        var total = await consulta.CountAsync(ct);
        var recursos = await consulta
            .OrderByDescending(r => r.ActualizadoEn)
            .ThenByDescending(r => r.IdRecurso)
            .Skip(Paginacion.Saltar(pagina, tamano))
            .Take(tamano)
            .ToListAsync(ct);

        return new PaginaResultado<ContenidoAdminDto>(recursos.Select(ADto).ToList(), total, pagina, tamano);
    }

    public async Task<ContenidoAdminDto> ObtenerAsync(int idRecurso, CancellationToken ct = default) =>
        ADto(await CargarAsync(idRecurso, null, ct));

    // Negocios

    public async Task<ContenidoAdminDto> CrearNegocioAsync(int idAdmin, GuardarNegocioRequest req, CancellationToken ct = default)
    {
        ValidacionContenido.ValidarRangoPrecios(req.PrecioMinimoAprox, req.PrecioMaximoAprox);
        var recurso = await NuevoRecursoAsync(idAdmin, TipoRecurso.Negocio, req.Titulo, req.Descripcion, req.IdCategorias, ct);
        recurso.Negocio = new Negocio
        {
            Recurso = recurso,
            IdUbicacion = req.IdUbicacion,
            Ubicacion = await UbicacionAsync(req.IdUbicacion, ct),
            Telefono = ValidacionContenido.NormalizarTextoOpcional(req.Telefono, 20, "El teléfono"),
            PrecioMinimoAprox = req.PrecioMinimoAprox,
            PrecioMaximoAprox = req.PrecioMaximoAprox
        };
        db.Negocios.Add(recurso.Negocio);
        return await GuardarNuevoAsync(idAdmin, recurso, "negocios", ct);
    }

    public async Task<ContenidoAdminDto> ActualizarNegocioAsync(
        int idAdmin, int idRecurso, GuardarNegocioRequest req, CancellationToken ct = default)
    {
        ValidacionContenido.ValidarRangoPrecios(req.PrecioMinimoAprox, req.PrecioMaximoAprox);
        var recurso = await CargarAsync(idRecurso, TipoRecurso.Negocio, ct, seguimiento: true);
        var anterior = recurso.Titulo;
        await AplicarDatosGeneralesAsync(recurso, req.Titulo, req.Descripcion, req.IdCategorias, ct);

        var negocio = recurso.Negocio!;
        negocio.IdUbicacion = req.IdUbicacion;
        negocio.Ubicacion = await UbicacionAsync(req.IdUbicacion, ct);
        negocio.Telefono = ValidacionContenido.NormalizarTextoOpcional(req.Telefono, 20, "El teléfono");
        negocio.PrecioMinimoAprox = req.PrecioMinimoAprox;
        negocio.PrecioMaximoAprox = req.PrecioMaximoAprox;

        return await GuardarEdicionAsync(idAdmin, recurso, "negocios", anterior, ct);
    }

    // Lugares

    public async Task<ContenidoAdminDto> CrearLugarAsync(int idAdmin, GuardarLugarRequest req, CancellationToken ct = default)
    {
        ValidacionContenido.ValidarMontoNoNegativo(req.CostoAcceso, "El costo de acceso");
        var recurso = await NuevoRecursoAsync(idAdmin, TipoRecurso.Lugar, req.Titulo, req.Descripcion, req.IdCategorias, ct);
        recurso.Lugar = new Lugar
        {
            Recurso = recurso,
            IdUbicacion = req.IdUbicacion,
            Ubicacion = await UbicacionAsync(req.IdUbicacion, ct),
            CostoAcceso = req.CostoAcceso,
            CondicionesAcceso = ValidacionContenido.NormalizarTextoOpcional(req.CondicionesAcceso, 2000, "Las condiciones de acceso")
        };
        db.Lugares.Add(recurso.Lugar);
        return await GuardarNuevoAsync(idAdmin, recurso, "lugares", ct);
    }

    public async Task<ContenidoAdminDto> ActualizarLugarAsync(
        int idAdmin, int idRecurso, GuardarLugarRequest req, CancellationToken ct = default)
    {
        ValidacionContenido.ValidarMontoNoNegativo(req.CostoAcceso, "El costo de acceso");
        var recurso = await CargarAsync(idRecurso, TipoRecurso.Lugar, ct, seguimiento: true);
        var anterior = recurso.Titulo;
        await AplicarDatosGeneralesAsync(recurso, req.Titulo, req.Descripcion, req.IdCategorias, ct);

        var lugar = recurso.Lugar!;
        lugar.IdUbicacion = req.IdUbicacion;
        lugar.Ubicacion = await UbicacionAsync(req.IdUbicacion, ct);
        lugar.CostoAcceso = req.CostoAcceso;
        lugar.CondicionesAcceso = ValidacionContenido.NormalizarTextoOpcional(req.CondicionesAcceso, 2000, "Las condiciones de acceso");

        return await GuardarEdicionAsync(idAdmin, recurso, "lugares", anterior, ct);
    }

    // Eventos

    public async Task<ContenidoAdminDto> CrearEventoAsync(int idAdmin, GuardarEventoRequest req, CancellationToken ct = default)
    {
        var (inicio, fin) = ValidarFechasEvento(req);
        var recurso = await NuevoRecursoAsync(idAdmin, TipoRecurso.Evento, req.Titulo, req.Descripcion, req.IdCategorias, ct);
        recurso.Evento = new Evento
        {
            Recurso = recurso,
            IdUbicacion = req.IdUbicacion,
            Ubicacion = await UbicacionAsync(req.IdUbicacion, ct),
            Inicio = inicio,
            Fin = fin,
            CostoEntrada = req.CostoEntrada,
            EstadoEvento = EstadoEvento.Programado,
            ContactoOrganizador = ValidacionContenido.NormalizarTextoOpcional(req.ContactoOrganizador, 150, "El contacto")
        };
        db.Eventos.Add(recurso.Evento);
        return await GuardarNuevoAsync(idAdmin, recurso, "eventos", ct);
    }

    public async Task<ContenidoAdminDto> ActualizarEventoAsync(
        int idAdmin, int idRecurso, GuardarEventoRequest req, CancellationToken ct = default)
    {
        var (inicio, fin) = ValidarFechasEvento(req);
        var recurso = await CargarAsync(idRecurso, TipoRecurso.Evento, ct, seguimiento: true);
        var anterior = recurso.Titulo;
        await AplicarDatosGeneralesAsync(recurso, req.Titulo, req.Descripcion, req.IdCategorias, ct);

        var evento = recurso.Evento!;
        evento.IdUbicacion = req.IdUbicacion;
        evento.Ubicacion = await UbicacionAsync(req.IdUbicacion, ct);
        evento.Inicio = inicio;
        evento.Fin = fin;
        evento.CostoEntrada = req.CostoEntrada;
        evento.ContactoOrganizador = ValidacionContenido.NormalizarTextoOpcional(req.ContactoOrganizador, 150, "El contacto");

        return await GuardarEdicionAsync(idAdmin, recurso, "eventos", anterior, ct);
    }

    private static (DateTime Inicio, DateTime Fin) ValidarFechasEvento(GuardarEventoRequest req)
    {
        ValidacionContenido.ValidarMontoNoNegativo(req.CostoEntrada, "El costo de entrada");
        var inicio = ValidacionContenido.AUtc(req.Inicio, "El inicio");
        var fin = ValidacionContenido.AUtc(req.Fin, "El fin");
        if (fin < inicio)
            throw new ReglaNegocioException("El fin del evento no puede ser anterior a su inicio.");
        return (inicio, fin);
    }

    // Estados (RF12, RF06)

    /// <summary>Publica un contenido revisado: queda visible al público y al asistente de IA.</summary>
    public async Task<ContenidoAdminDto> PublicarAsync(int idAdmin, int idRecurso, CancellationToken ct = default)
    {
        var recurso = await CargarAsync(idRecurso, null, ct, seguimiento: true);
        if (recurso.EstadoPublicacion == EstadoPublicacion.Publicado)
            throw new ReglaNegocioException("El contenido ya está publicado.");

        var revisor = await db.Usuarios.SingleOrDefaultAsync(u => u.IdUsuario == idAdmin, ct)
            ?? throw new NoAutenticadoException("Usuario no encontrado.");
        var estadoAnterior = recurso.EstadoPublicacion;
        recurso.EstadoPublicacion = EstadoPublicacion.Publicado;
        recurso.IdRevisor = idAdmin;
        recurso.Revisor = revisor;
        recurso.FechaRevision = reloj.AhoraUtc;
        recurso.ActualizadoEn = reloj.AhoraUtc;

        bitacora.Registrar(idAdmin, AccionesBitacora.Publicar, "recursos", idRecurso.ToString(),
            new { estadoAnterior = estadoAnterior.ToString().ToLowerInvariant() });
        await db.SaveChangesAsync(ct);
        return ADto(recurso);
    }

    /// <summary>Retira un contenido sin borrarlo: deja de verse en público pero se conserva para favoritos e historial.</summary>
    public async Task<ContenidoAdminDto> ArchivarAsync(int idAdmin, int idRecurso, CancellationToken ct = default)
    {
        var recurso = await CargarAsync(idRecurso, null, ct, seguimiento: true);
        if (recurso.EstadoPublicacion == EstadoPublicacion.Archivado)
            throw new ReglaNegocioException("El contenido ya está archivado.");

        var estadoAnterior = recurso.EstadoPublicacion;
        recurso.EstadoPublicacion = EstadoPublicacion.Archivado;
        recurso.ActualizadoEn = reloj.AhoraUtc;

        bitacora.Registrar(idAdmin, AccionesBitacora.Archivar, "recursos", idRecurso.ToString(),
            new { estadoAnterior = estadoAnterior.ToString().ToLowerInvariant() });
        await db.SaveChangesAsync(ct);
        return ADto(recurso);
    }

    /// <summary>Marca un evento como programado, cancelado o finalizado (RF06: los cambios se muestran al público).</summary>
    public async Task<ContenidoAdminDto> CambiarEstadoEventoAsync(
        int idAdmin, int idRecurso, CambiarEstadoEventoRequest req, CancellationToken ct = default)
    {
        if (!Enum.IsDefined(req.EstadoEvento))
            throw new ReglaNegocioException("Estado de evento no válido.");

        var recurso = await CargarAsync(idRecurso, TipoRecurso.Evento, ct, seguimiento: true);
        var evento = recurso.Evento!;
        if (evento.EstadoEvento == req.EstadoEvento)
            return ADto(recurso);

        var estadoAnterior = evento.EstadoEvento;
        evento.EstadoEvento = req.EstadoEvento;
        recurso.ActualizadoEn = reloj.AhoraUtc;

        bitacora.Registrar(idAdmin, AccionesBitacora.Editar, "eventos", idRecurso.ToString(),
            new { estadoAnterior = estadoAnterior.ToString().ToLowerInvariant(), estadoNuevo = req.EstadoEvento.ToString().ToLowerInvariant() });
        await db.SaveChangesAsync(ct);
        return ADto(recurso);
    }

    // Piezas comunes

    private IQueryable<Recurso> ConsultaCompleta() =>
        db.Recursos
            .Include(r => r.Creador)
            .Include(r => r.Revisor)
            .Include(r => r.Categorias).ThenInclude(rc => rc.Categoria)
            .Include(r => r.Fotografias)
            .Include(r => r.HorariosVisita)
            .Include(r => r.Negocio!).ThenInclude(n => n.Ubicacion).ThenInclude(u => u.Localidad)
            .Include(r => r.Evento!).ThenInclude(e => e.Ubicacion).ThenInclude(u => u.Localidad)
            .Include(r => r.Lugar!).ThenInclude(l => l.Ubicacion).ThenInclude(u => u.Localidad);

    private async Task<Recurso> CargarAsync(int idRecurso, TipoRecurso? tipo, CancellationToken ct, bool seguimiento = false)
    {
        var consulta = seguimiento ? ConsultaCompleta() : ConsultaCompleta().AsNoTracking();
        var recurso = await consulta.SingleOrDefaultAsync(r => r.IdRecurso == idRecurso && r.Tipo != TipoRecurso.Ruta, ct);
        if (recurso is null || (tipo.HasValue && recurso.Tipo != tipo.Value))
            throw new NoEncontradoException("Contenido no encontrado.");
        return recurso;
    }

    private async Task<Recurso> NuevoRecursoAsync(
        int idAdmin, TipoRecurso tipo, string titulo, string? descripcion, IReadOnlyList<int>? idCategorias, CancellationToken ct)
    {
        var admin = await db.Usuarios.SingleOrDefaultAsync(u => u.IdUsuario == idAdmin, ct)
            ?? throw new NoAutenticadoException("Usuario no encontrado.");

        var recurso = new Recurso
        {
            Tipo = tipo,
            EstadoPublicacion = EstadoPublicacion.Pendiente,
            IdCreador = idAdmin,
            Creador = admin,
            ActualizadoEn = reloj.AhoraUtc
        };
        await AplicarDatosGeneralesAsync(recurso, titulo, descripcion, idCategorias, ct);
        db.Recursos.Add(recurso);
        return recurso;
    }

    private async Task AplicarDatosGeneralesAsync(
        Recurso recurso, string titulo, string? descripcion, IReadOnlyList<int>? idCategorias, CancellationToken ct)
    {
        recurso.Titulo = ValidacionContenido.NormalizarTitulo(titulo);
        recurso.Descripcion = ValidacionContenido.NormalizarTextoOpcional(
            descripcion, ValidacionContenido.DescripcionMax, "La descripción");

        var ids = (idCategorias ?? []).Distinct().ToList();
        var categorias = ids.Count == 0 ? [] : await db.Categorias.Where(c => ids.Contains(c.IdCategoria)).ToListAsync(ct);
        var faltantes = ids.Except(categorias.Select(c => c.IdCategoria)).ToList();
        if (faltantes.Count > 0)
            throw new ReglaNegocioException($"No existen las categorías: {string.Join(", ", faltantes)}.");

        foreach (var quitar in recurso.Categorias.Where(rc => !ids.Contains(rc.IdCategoria)).ToList())
        {
            recurso.Categorias.Remove(quitar);
            db.RecursoCategorias.Remove(quitar);
        }
        foreach (var categoria in categorias.Where(c => recurso.Categorias.All(rc => rc.IdCategoria != c.IdCategoria)))
        {
            var enlace = new RecursoCategoria { Recurso = recurso, IdRecurso = recurso.IdRecurso, Categoria = categoria, IdCategoria = categoria.IdCategoria };
            recurso.Categorias.Add(enlace);
            db.RecursoCategorias.Add(enlace);
        }
    }

    private async Task<Ubicacion> UbicacionAsync(int idUbicacion, CancellationToken ct) =>
        await db.Ubicaciones.Include(u => u.Localidad).SingleOrDefaultAsync(u => u.IdUbicacion == idUbicacion, ct)
        ?? throw new ReglaNegocioException("La ubicación indicada no existe. Regístrala primero.");

    private async Task<ContenidoAdminDto> GuardarNuevoAsync(int idAdmin, Recurso recurso, string tablaDetalle, CancellationToken ct)
    {
        await db.SaveChangesAsync(ct);
        bitacora.Registrar(idAdmin, AccionesBitacora.Crear, tablaDetalle, recurso.IdRecurso.ToString(),
            new { recurso.Titulo, tipo = recurso.Tipo.ToString().ToLowerInvariant() });
        await db.SaveChangesAsync(ct);
        return ADto(recurso);
    }

    private async Task<ContenidoAdminDto> GuardarEdicionAsync(
        int idAdmin, Recurso recurso, string tablaDetalle, string tituloAnterior, CancellationToken ct)
    {
        recurso.ActualizadoEn = reloj.AhoraUtc;
        bitacora.Registrar(idAdmin, AccionesBitacora.Editar, tablaDetalle, recurso.IdRecurso.ToString(),
            new { tituloAnterior, tituloNuevo = recurso.Titulo });
        await db.SaveChangesAsync(ct);
        return ADto(recurso);
    }

    internal static ContenidoAdminDto ADto(Recurso r) => new(
        r.IdRecurso,
        r.Tipo,
        r.Titulo,
        r.Descripcion,
        r.EstadoPublicacion,
        r.Creador?.Nombre ?? string.Empty,
        r.Revisor?.Nombre,
        r.FechaRevision,
        r.ActualizadoEn,
        AnalizadorItinerario.UbicacionDe(r)?.Localidad?.Nombre,
        r.Categorias.Select(c => c.Categoria.Nombre).OrderBy(n => n).ToList());
}
