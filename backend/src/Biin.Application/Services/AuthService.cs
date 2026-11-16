using Biin.Application.DTOs.Auth;
using Biin.Application.Interfaces;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Biin.Application.Services;

/// <summary>Registro, inicio de sesión y datos del usuario actual (CU-01, RF01).</summary>
public class AuthService(IAppDbContext db, IHashContrasena hash, IGeneradorToken tokens)
{
    public async Task<AuthResponse> RegistrarAsync(RegistroRequest req, CancellationToken ct = default)
    {
        var correo = req.Correo.Trim().ToLowerInvariant();

        if (await db.Usuarios.AnyAsync(u => u.Correo.ToLower() == correo, ct))
            throw new ConflictoException("Ya existe una cuenta con ese correo.");

        var rolViajero = await db.Roles.SingleOrDefaultAsync(r => r.Nombre == Roles.Viajero, ct)
            ?? throw new ReglaNegocioException("Falta el rol 'viajero'. Ejecuta database/seed/001_catalogos.sql.");

        var usuario = new Usuario
        {
            Nombre = req.Nombre.Trim(),
            Correo = correo,
            HashContrasena = hash.Generar(req.Contrasena),
            FechaRegistro = DateTime.UtcNow
        };
        usuario.Roles.Add(new UsuarioRol { Rol = rolViajero });

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync(ct);

        return CrearRespuesta(usuario, [Roles.Viajero]);
    }

    public async Task<AuthResponse> IniciarSesionAsync(LoginRequest req, CancellationToken ct = default)
    {
        var correo = req.Correo.Trim().ToLowerInvariant();

        var usuario = await db.Usuarios
            .Include(u => u.Roles).ThenInclude(ur => ur.Rol)
            .SingleOrDefaultAsync(u => u.Correo.ToLower() == correo, ct);

        // Mismo mensaje para correo o contraseña incorrectos: no revela qué cuentas existen
        if (usuario is null || !hash.Verificar(req.Contrasena, usuario.HashContrasena))
            throw new NoAutenticadoException("Correo o contraseña incorrectos.");

        if (!usuario.Activo)
            throw new NoAutenticadoException("La cuenta está desactivada.");

        var roles = usuario.Roles.Select(r => r.Rol.Nombre).ToList();
        return CrearRespuesta(usuario, roles);
    }

    public async Task<UsuarioDto> ObtenerActualAsync(int idUsuario, CancellationToken ct = default)
    {
        var usuario = await db.Usuarios
            .Include(u => u.Roles).ThenInclude(ur => ur.Rol)
            .SingleOrDefaultAsync(u => u.IdUsuario == idUsuario, ct)
            ?? throw new NoEncontradoException("Usuario no encontrado.");

        return new UsuarioDto(usuario.IdUsuario, usuario.Nombre, usuario.Correo,
            usuario.Roles.Select(r => r.Rol.Nombre).ToList());
    }

    private AuthResponse CrearRespuesta(Usuario usuario, IReadOnlyList<string> roles)
    {
        var (token, expira) = tokens.Generar(usuario, roles);
        return new AuthResponse(token, expira,
            new UsuarioDto(usuario.IdUsuario, usuario.Nombre, usuario.Correo, roles));
    }
}
