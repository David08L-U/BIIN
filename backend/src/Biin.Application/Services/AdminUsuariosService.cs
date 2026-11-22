using Biin.Application.DTOs.Admin;
using Biin.Application.DTOs.Usuarios;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>Gestión administrativa de usuarios, roles y rutas operadas (CU-12, RF12, RNF04).</summary>
public class AdminUsuariosService(IAppDbContext db, IHashContrasena hash, IBitacoraAdmin bitacora)
{
    public async Task<IReadOnlyList<RolDto>> ListarRolesAsync(CancellationToken ct = default) =>
        await db.Roles
            .AsNoTracking()
            .OrderBy(r => r.Nombre)
            .Select(r => new RolDto(r.IdRol, r.Nombre))
            .ToListAsync(ct);

    public async Task<PaginaResultado<UsuarioResumenDto>> ListarUsuariosAsync(
        FiltroUsuariosRequest filtro,
        CancellationToken ct = default)
    {
        var pagina = Math.Max(1, filtro.Pagina);
        var tamano = Math.Clamp(filtro.Tamano, 1, 100);

        var consulta = db.Usuarios
            .AsNoTracking()
            .Include(u => u.Roles).ThenInclude(ur => ur.Rol)
            .Include(u => u.RutasOperadas)
            .AsQueryable();

        if (filtro.Activo.HasValue)
            consulta = consulta.Where(u => u.Activo == filtro.Activo.Value);

        if (!string.IsNullOrWhiteSpace(filtro.Rol))
        {
            var rolBuscado = filtro.Rol.Trim().ToLowerInvariant();
            consulta = consulta.Where(u => u.Roles.Any(ur => ur.Rol.Nombre == rolBuscado));
        }

        if (!string.IsNullOrWhiteSpace(filtro.Busqueda))
        {
            var texto = filtro.Busqueda.Trim().ToLowerInvariant();
            consulta = consulta.Where(u =>
                u.Nombre.ToLower().Contains(texto) ||
                u.Correo.ToLower().Contains(texto));
        }

        var total = await consulta.CountAsync(ct);
        var usuarios = await consulta
            .OrderBy(u => u.IdUsuario)
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .ToListAsync(ct);

        var items = usuarios
            .Select(u => new UsuarioResumenDto(
                u.IdUsuario,
                u.Nombre,
                u.Correo,
                u.Activo,
                u.FechaRegistro,
                u.Roles.Select(r => r.Rol.Nombre).OrderBy(n => n).ToList(),
                u.RutasOperadas.Count))
            .ToList();

        return new PaginaResultado<UsuarioResumenDto>(items, total, pagina, tamano);
    }

    public async Task<PerfilUsuarioDto> ObtenerPorIdAsync(int idUsuario, CancellationToken ct = default)
    {
        var usuario = await CargarUsuarioCompletoAsync(idUsuario, ct)
            ?? throw new NoEncontradoException("Usuario no encontrado.");

        return UsuariosService.MapearPerfil(usuario);
    }

    public async Task<PerfilUsuarioDto> CrearUsuarioAsync(
        int idAdminActual,
        CrearUsuarioAdminRequest req,
        CancellationToken ct = default)
    {
        var nombre = req.Nombre.Trim();
        if (nombre.Length is < 2 or > 120)
            throw new ReglaNegocioException("El nombre debe tener entre 2 y 120 caracteres.");

        if (string.IsNullOrWhiteSpace(req.Contrasena) || req.Contrasena.Length is < 8 or > 72)
            throw new ReglaNegocioException("La contraseña debe tener entre 8 y 72 caracteres.");

        var correo = req.Correo.Trim().ToLowerInvariant();
        if (await db.Usuarios.AnyAsync(u => u.Correo.ToLower() == correo, ct))
            throw new ConflictoException("Ya existe una cuenta con ese correo.");

        var rolesSolicitados = NormalizarRolesConViajero(req.Roles);
        var rolesEntidades = await ResolverRolesAsync(rolesSolicitados, ct);

        var idRutas = (req.IdRutas ?? []).Distinct().ToList();
        List<Ruta> rutasEntidades = [];
        if (idRutas.Count > 0)
        {
            if (!rolesSolicitados.Contains(Roles.Operador))
                throw new ReglaNegocioException("Solo se pueden asignar rutas a usuarios con rol 'operador'.");

            rutasEntidades = await ResolverRutasAsync(idRutas, ct);
        }

        var usuario = new Usuario
        {
            Nombre = nombre,
            Correo = correo,
            HashContrasena = hash.Generar(req.Contrasena),
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        foreach (var rol in rolesEntidades)
            usuario.Roles.Add(new UsuarioRol { Usuario = usuario, Rol = rol, IdRol = rol.IdRol });

        foreach (var ruta in rutasEntidades)
            usuario.RutasOperadas.Add(new OperadorRuta { Usuario = usuario, Ruta = ruta, IdRuta = ruta.IdRecurso });

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync(ct);

        bitacora.Registrar(
            idAdminActual,
            AccionesBitacora.Crear,
            "usuarios",
            usuario.IdUsuario.ToString(),
            new { usuario.Correo, roles = rolesSolicitados, idRutas });
        await db.SaveChangesAsync(ct);

        return UsuariosService.MapearPerfil(usuario);
    }

    public async Task<PerfilUsuarioDto> ActualizarRolesAsync(
        int idAdminActual,
        int idUsuario,
        ActualizarRolesRequest req,
        CancellationToken ct = default)
    {
        var usuario = await CargarUsuarioCompletoAsync(idUsuario, ct)
            ?? throw new NoEncontradoException("Usuario no encontrado.");

        var rolesAnteriores = usuario.Roles.Select(r => r.Rol.Nombre).OrderBy(n => n).ToList();
        var rolesSolicitados = NormalizarRolesConViajero(req.Roles);
        var rolesEntidades = await ResolverRolesAsync(rolesSolicitados, ct);

        var teniaAdmin = rolesAnteriores.Contains(Roles.Administrador);
        var tendraAdmin = rolesSolicitados.Contains(Roles.Administrador);

        if (idUsuario == idAdminActual && teniaAdmin && !tendraAdmin)
            throw new ReglaNegocioException("No puedes quitarte a ti mismo el rol de administrador.");

        if (usuario.Activo && teniaAdmin && !tendraAdmin)
            await AsegurarOtroAdministradorActivoAsync(idUsuario, ct);

        // Quitar roles que ya no aplican
        var nombresNuevos = new HashSet<string>(rolesSolicitados, StringComparer.Ordinal);
        var rolesAQuitar = usuario.Roles.Where(ur => !nombresNuevos.Contains(ur.Rol.Nombre)).ToList();
        foreach (var quitar in rolesAQuitar)
        {
            usuario.Roles.Remove(quitar);
            db.UsuarioRoles.Remove(quitar);
        }

        // Agregar roles faltantes
        var nombresActuales = new HashSet<string>(usuario.Roles.Select(ur => ur.Rol.Nombre), StringComparer.Ordinal);
        foreach (var rol in rolesEntidades.Where(r => !nombresActuales.Contains(r.Nombre)))
        {
            var enlace = new UsuarioRol { IdUsuario = usuario.IdUsuario, IdRol = rol.IdRol, Usuario = usuario, Rol = rol };
            usuario.Roles.Add(enlace);
            db.UsuarioRoles.Add(enlace);
        }

        // Si se retira el rol operador, limpiar asignaciones residuales de operador_ruta
        List<int> rutasLimpiadas = [];
        var teniaOperador = rolesAnteriores.Contains(Roles.Operador);
        var tendraOperador = rolesSolicitados.Contains(Roles.Operador);
        if (teniaOperador && !tendraOperador && usuario.RutasOperadas.Count > 0)
        {
            rutasLimpiadas = usuario.RutasOperadas.Select(r => r.IdRuta).OrderBy(id => id).ToList();
            foreach (var rutaOp in usuario.RutasOperadas.ToList())
            {
                usuario.RutasOperadas.Remove(rutaOp);
                db.OperadorRutas.Remove(rutaOp);
            }
        }

        bitacora.Registrar(
            idAdminActual,
            AccionesBitacora.Editar,
            "usuario_rol",
            idUsuario.ToString(),
            new { rolesAnteriores, rolesNuevos = rolesSolicitados, rutasLimpiadas });

        await db.SaveChangesAsync(ct);
        return UsuariosService.MapearPerfil(usuario);
    }

    public async Task<PerfilUsuarioDto> CambiarEstadoAsync(
        int idAdminActual,
        int idUsuario,
        CambiarEstadoUsuarioRequest req,
        CancellationToken ct = default)
    {
        var usuario = await CargarUsuarioCompletoAsync(idUsuario, ct)
            ?? throw new NoEncontradoException("Usuario no encontrado.");

        if (idUsuario == idAdminActual && !req.Activo)
            throw new ReglaNegocioException("No puedes desactivar tu propia cuenta desde administración.");

        var esAdmin = usuario.Roles.Any(r => r.Rol.Nombre == Roles.Administrador);
        if (!req.Activo && usuario.Activo && esAdmin)
            await AsegurarOtroAdministradorActivoAsync(idUsuario, ct);

        var estadoAnterior = usuario.Activo;
        usuario.Activo = req.Activo;

        bitacora.Registrar(
            idAdminActual,
            req.Activo ? AccionesBitacora.Editar : AccionesBitacora.Archivar,
            "usuarios",
            idUsuario.ToString(),
            new { activoAnterior = estadoAnterior, activoNuevo = req.Activo });

        await db.SaveChangesAsync(ct);
        return UsuariosService.MapearPerfil(usuario);
    }

    public async Task<PerfilUsuarioDto> ActualizarRutasOperadorAsync(
        int idAdminActual,
        int idUsuario,
        ActualizarRutasOperadorRequest req,
        CancellationToken ct = default)
    {
        var usuario = await CargarUsuarioCompletoAsync(idUsuario, ct)
            ?? throw new NoEncontradoException("Usuario no encontrado.");

        if (!usuario.Roles.Any(r => r.Rol.Nombre == Roles.Operador))
            throw new ReglaNegocioException("El usuario debe tener el rol 'operador' para asignarle rutas.");

        var idRutasNuevas = req.IdRutas.Distinct().OrderBy(id => id).ToList();
        var rutasEntidades = idRutasNuevas.Count > 0
            ? await ResolverRutasAsync(idRutasNuevas, ct)
            : [];

        var rutasAnteriores = usuario.RutasOperadas.Select(r => r.IdRuta).OrderBy(id => id).ToList();

        var conjuntoNuevas = new HashSet<int>(idRutasNuevas);
        foreach (var quitar in usuario.RutasOperadas.Where(r => !conjuntoNuevas.Contains(r.IdRuta)).ToList())
        {
            usuario.RutasOperadas.Remove(quitar);
            db.OperadorRutas.Remove(quitar);
        }

        var conjuntoActuales = new HashSet<int>(usuario.RutasOperadas.Select(r => r.IdRuta));
        foreach (var ruta in rutasEntidades.Where(r => !conjuntoActuales.Contains(r.IdRecurso)))
        {
            var enlace = new OperadorRuta
            {
                IdUsuario = usuario.IdUsuario,
                IdRuta = ruta.IdRecurso,
                Usuario = usuario,
                Ruta = ruta
            };
            usuario.RutasOperadas.Add(enlace);
            db.OperadorRutas.Add(enlace);
        }

        bitacora.Registrar(
            idAdminActual,
            AccionesBitacora.Editar,
            "operador_ruta",
            idUsuario.ToString(),
            new { rutasAnteriores, rutasNuevas = idRutasNuevas });

        await db.SaveChangesAsync(ct);
        return UsuariosService.MapearPerfil(usuario);
    }

    private Task<Usuario?> CargarUsuarioCompletoAsync(int idUsuario, CancellationToken ct) =>
        db.Usuarios
            .Include(u => u.Roles).ThenInclude(ur => ur.Rol)
            .Include(u => u.RutasOperadas).ThenInclude(or => or.Ruta).ThenInclude(r => r.Recurso)
            .SingleOrDefaultAsync(u => u.IdUsuario == idUsuario, ct);

    private static List<string> NormalizarRolesConViajero(IEnumerable<string> roles)
    {
        var conjunto = new HashSet<string>(StringComparer.Ordinal) { Roles.Viajero };
        foreach (var rol in roles)
        {
            if (!string.IsNullOrWhiteSpace(rol))
                conjunto.Add(rol.Trim().ToLowerInvariant());
        }
        return conjunto.OrderBy(n => n).ToList();
    }

    private async Task<List<Rol>> ResolverRolesAsync(IReadOnlyCollection<string> nombres, CancellationToken ct)
    {
        var roles = await db.Roles
            .Where(r => nombres.Contains(r.Nombre))
            .ToListAsync(ct);

        var encontrados = roles.Select(r => r.Nombre).ToHashSet(StringComparer.Ordinal);
        var faltantes = nombres.Where(n => !encontrados.Contains(n)).ToList();
        if (faltantes.Count > 0)
            throw new ReglaNegocioException($"Los siguientes roles no existen: {string.Join(", ", faltantes)}.");

        return roles;
    }

    private async Task<List<Ruta>> ResolverRutasAsync(IReadOnlyCollection<int> idRutas, CancellationToken ct)
    {
        var rutas = await db.Rutas
            .Include(r => r.Recurso)
            .Where(r => idRutas.Contains(r.IdRecurso))
            .ToListAsync(ct);

        var encontradas = rutas.Select(r => r.IdRecurso).ToHashSet();
        var faltantes = idRutas.Where(id => !encontradas.Contains(id)).ToList();
        if (faltantes.Count > 0)
            throw new ReglaNegocioException($"No existen las rutas: {string.Join(", ", faltantes)}.");

        return rutas;
    }

    private async Task AsegurarOtroAdministradorActivoAsync(int idUsuarioExcluido, CancellationToken ct)
    {
        var hayOtroAdmin = await db.Usuarios.AnyAsync(u =>
            u.Activo &&
            u.IdUsuario != idUsuarioExcluido &&
            u.Roles.Any(r => r.Rol.Nombre == Roles.Administrador), ct);

        if (!hayOtroAdmin)
            throw new ReglaNegocioException("Debe permanecer al menos un administrador activo en el sistema.");
    }
}
