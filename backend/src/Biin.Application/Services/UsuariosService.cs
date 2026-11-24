using Biin.Application.DTOs.Usuarios;
using Biin.Application.Interfaces;
using Biin.Application.Validators;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>Gestión del perfil propio del usuario autenticado (CU-01, RF01).</summary>
public class UsuariosService(IAppDbContext db, IHashContrasena hash, IRevocacionToken revocacion)
{
    public async Task<PerfilUsuarioDto> ObtenerPerfilAsync(int idUsuario, CancellationToken ct = default)
    {
        var usuario = await CargarUsuarioCompletoAsync(idUsuario, ct)
            ?? throw new NoEncontradoException("Usuario no encontrado.");

        if (!usuario.Activo)
            throw new NoAutenticadoException("La cuenta está desactivada.");

        return MapearPerfil(usuario);
    }

    public async Task<PerfilUsuarioDto> ActualizarPerfilAsync(
        int idUsuario,
        ActualizarPerfilRequest req,
        CancellationToken ct = default)
    {
        var usuario = await CargarUsuarioCompletoAsync(idUsuario, ct)
            ?? throw new NoEncontradoException("Usuario no encontrado.");

        if (!usuario.Activo)
            throw new NoAutenticadoException("La cuenta está desactivada.");

        var nombre = ValidacionUsuario.NormalizarNombre(req.Nombre);
        var correo = ValidacionUsuario.NormalizarCorreo(req.Correo);
        if (!string.Equals(usuario.Correo, correo, StringComparison.OrdinalIgnoreCase))
        {
            var correoEnUso = await db.Usuarios
                .AnyAsync(u => u.IdUsuario != idUsuario && u.Correo.ToLower() == correo, ct);
            if (correoEnUso)
                throw new ConflictoException("Ya existe una cuenta con ese correo.");
        }

        usuario.Nombre = nombre;
        usuario.Correo = correo;
        await db.SaveChangesAsync(ct);

        return MapearPerfil(usuario);
    }

    public async Task DesactivarCuentaPropiaAsync(
        int idUsuario,
        DesactivarCuentaRequest req,
        string? jtiActual,
        DateTime? expiraEnUtc,
        CancellationToken ct = default)
    {
        var usuario = await db.Usuarios
            .Include(u => u.Roles).ThenInclude(ur => ur.Rol)
            .SingleOrDefaultAsync(u => u.IdUsuario == idUsuario, ct)
            ?? throw new NoEncontradoException("Usuario no encontrado.");

        if (!usuario.Activo)
            throw new NoAutenticadoException("La cuenta ya está desactivada.");

        if (!hash.Verificar(req.ContrasenaActual, usuario.HashContrasena))
            throw new ReglaNegocioException("La contraseña actual es incorrecta.");

        var esAdmin = usuario.Roles.Any(r => r.Rol.Nombre == Roles.Administrador);
        if (esAdmin)
        {
            var hayOtroAdminActivo = await db.Usuarios
                .AnyAsync(u =>
                    u.Activo &&
                    u.IdUsuario != idUsuario &&
                    u.Roles.Any(r => r.Rol.Nombre == Roles.Administrador), ct);

            if (!hayOtroAdminActivo)
                throw new ReglaNegocioException("No puedes desactivar tu cuenta porque eres el último administrador activo.");
        }

        usuario.Activo = false;
        await db.SaveChangesAsync(ct);

        if (!string.IsNullOrWhiteSpace(jtiActual) && expiraEnUtc.HasValue)
            revocacion.Revocar(jtiActual, expiraEnUtc.Value);
    }

    private Task<Usuario?> CargarUsuarioCompletoAsync(int idUsuario, CancellationToken ct) =>
        db.Usuarios
            .Include(u => u.Roles).ThenInclude(ur => ur.Rol)
            .Include(u => u.RutasOperadas).ThenInclude(or => or.Ruta).ThenInclude(r => r.Recurso)
            .SingleOrDefaultAsync(u => u.IdUsuario == idUsuario, ct);

    internal static PerfilUsuarioDto MapearPerfil(Usuario usuario) =>
        new(
            usuario.IdUsuario,
            usuario.Nombre,
            usuario.Correo,
            usuario.Activo,
            usuario.FechaRegistro,
            usuario.Roles.Select(r => r.Rol.Nombre).OrderBy(n => n).ToList(),
            usuario.RutasOperadas
                .Select(or => new RutaOperadaDto(
                    or.IdRuta,
                    or.Ruta.Codigo,
                    or.Ruta.Recurso?.Titulo ?? or.Ruta.Codigo,
                    or.Ruta.Activa))
                .OrderBy(r => r.Codigo)
                .ToList());
}
