using System.Security.Cryptography;
using Biin.Application.DTOs.Auth;
using Biin.Application.DTOs.Usuarios;
using Biin.Application.Interfaces;
using Biin.Application.Validators;
using Biin.Domain.Entities;
using Biin.Domain.Enums;
using Biin.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Biin.Application.Services;

/// <summary>Registro con confirmación de correo, inicio/cierre de sesión y datos del usuario actual (CU-01, RF01).</summary>
public class AuthService(
    IAppDbContext db,
    IHashContrasena hash,
    IGeneradorToken tokens,
    IRevocacionToken revocacion,
    IReloj reloj,
    IEnvioCorreo envioCorreo,
    IValidadorDominioCorreo validadorDominio,
    IOptions<VerificacionCorreoOptions> opcionesVerificacion)
{
    private readonly VerificacionCorreoOptions _verificacion = opcionesVerificacion.Value;

    /// <summary>
    /// Primer paso del registro de un viajero: guarda los datos como pendientes y manda un código al correo.
    /// La cuenta se crea hasta que el viajero confirma el código; si el correo no existe, nunca llega.
    /// Volver a registrarse con el mismo correo reemplaza nombre y contraseña; el código solo se reenvía
    /// si ya pasó la espera entre envíos (así el viajero puede regresar a corregir sus datos).
    /// </summary>
    public async Task<RegistroPendienteResponse> RegistrarAsync(RegistroRequest req, CancellationToken ct = default)
    {
        var nombre = ValidacionUsuario.NormalizarNombre(req.Nombre);
        var correo = ValidacionUsuario.NormalizarCorreo(req.Correo);
        ValidacionUsuario.ValidarContrasena(req.Contrasena);
        await ValidarDominioAsync(correo, ct);

        if (await db.Usuarios.AnyAsync(u => u.Correo.ToLower() == correo, ct))
            throw new ConflictoException("Ya existe una cuenta con ese correo.");

        var ahora = reloj.AhoraUtc;
        await BorrarVencidosAsync(ahora, correo, ct);

        var pendiente = await BuscarPendienteAsync(correo, ct);
        var enviar = pendiente is null || ahora >= ReenviarDesde(pendiente);
        if (pendiente is null)
        {
            pendiente = new RegistroPendiente { Correo = correo };
            db.RegistrosPendientes.Add(pendiente);
        }

        pendiente.Nombre = nombre;
        pendiente.HashContrasena = hash.Generar(req.Contrasena);
        var codigo = enviar ? RenovarCodigo(pendiente, ahora) : null;
        await db.SaveChangesAsync(ct);

        if (codigo is not null)
            await EnviarCodigoAsync(pendiente, codigo, ct);

        return RespuestaPendiente(pendiente);
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

        var roles = usuario.Roles.Select(r => r.Rol.Nombre).OrderBy(n => n).ToList();
        return CrearRespuesta(usuario, roles);
    }

    public async Task<PerfilUsuarioDto> ObtenerActualAsync(int idUsuario, CancellationToken ct = default)
    {
        var usuario = await db.Usuarios
            .Include(u => u.Roles).ThenInclude(ur => ur.Rol)
            .Include(u => u.RutasOperadas).ThenInclude(or => or.Ruta).ThenInclude(r => r.Recurso)
            .SingleOrDefaultAsync(u => u.IdUsuario == idUsuario, ct)
            ?? throw new NoEncontradoException("Usuario no encontrado.");

        if (!usuario.Activo)
            throw new NoAutenticadoException("La cuenta está desactivada.");

        return UsuariosService.MapearPerfil(usuario);
    }

    public void CerrarSesion(string? jti, DateTime? expiraEnUtc)
    {
        if (!string.IsNullOrWhiteSpace(jti) && expiraEnUtc.HasValue)
            revocacion.Revocar(jti, expiraEnUtc.Value);
    }

    public async Task CambiarContrasenaAsync(
        int idUsuario,
        CambiarContrasenaRequest req,
        string? jtiActual,
        DateTime? expiraEnUtc,
        CancellationToken ct = default)
    {
        ValidacionUsuario.ValidarContrasena(req.ContrasenaNueva);

        var usuario = await db.Usuarios
            .SingleOrDefaultAsync(u => u.IdUsuario == idUsuario, ct)
            ?? throw new NoEncontradoException("Usuario no encontrado.");

        if (!usuario.Activo)
            throw new NoAutenticadoException("La cuenta está desactivada.");

        if (!hash.Verificar(req.ContrasenaActual, usuario.HashContrasena))
            throw new ReglaNegocioException("La contraseña actual es incorrecta.");

        if (req.ContrasenaNueva == req.ContrasenaActual ||
            hash.Verificar(req.ContrasenaNueva, usuario.HashContrasena))
            throw new ReglaNegocioException("La nueva contraseña debe ser diferente a la actual.");

        usuario.HashContrasena = hash.Generar(req.ContrasenaNueva);
        await db.SaveChangesAsync(ct);

        CerrarSesion(jtiActual, expiraEnUtc);
    }

    private AuthResponse CrearRespuesta(Usuario usuario, IReadOnlyList<string> roles)
    {
        var (token, expira) = tokens.Generar(usuario, roles);
        return new AuthResponse(token, expira,
            new UsuarioDto(usuario.IdUsuario, usuario.Nombre, usuario.Correo, roles));
    }

    // ---- Confirmación de correo (registro de viajeros) ----

    private async Task ValidarDominioAsync(string correo, CancellationToken ct)
    {
        if (!_verificacion.ValidarDominio) return;

        var dominio = correo[(correo.LastIndexOf('@') + 1)..];
        if (!await validadorDominio.PuedeRecibirCorreoAsync(dominio, ct))
            throw new ReglaNegocioException(
                $"El dominio «{dominio}» no recibe correos. Revisa que tu correo esté bien escrito.");
    }

    private Task<RegistroPendiente?> BuscarPendienteAsync(string correo, CancellationToken ct) =>
        db.RegistrosPendientes.SingleOrDefaultAsync(r => r.Correo.ToLower() == correo, ct);

    /// <summary>
    /// Borra los registros cuyo código ya venció: esos correos nunca se confirmaron.
    /// El del correo que se está registrando se conserva para reutilizar su fila.
    /// </summary>
    private async Task BorrarVencidosAsync(DateTime ahora, string correoActual, CancellationToken ct)
    {
        var vencidos = await db.RegistrosPendientes
            .Where(r => r.ExpiraEn <= ahora && r.Correo.ToLower() != correoActual)
            .Take(100)
            .ToListAsync(ct);
        foreach (var vencido in vencidos)
            db.RegistrosPendientes.Remove(vencido);
    }

    /// <summary>Genera un código nuevo de 6 dígitos, guarda solo su hash y reinicia los intentos.</summary>
    private string RenovarCodigo(RegistroPendiente pendiente, DateTime ahora)
    {
        var codigo = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        pendiente.HashCodigo = hash.Generar(codigo);
        pendiente.Intentos = 0;
        pendiente.EnviadoEn = ahora;
        pendiente.ExpiraEn = ahora.AddMinutes(_verificacion.MinutosVigencia);
        return codigo;
    }

    private async Task EnviarCodigoAsync(RegistroPendiente pendiente, string codigo, CancellationToken ct)
    {
        try
        {
            await envioCorreo.EnviarCodigoVerificacionAsync(pendiente.Correo, pendiente.Nombre, codigo, pendiente.ExpiraEn, ct);
        }
        catch (InvalidOperationException)
        {
            // Sin correo enviado no debe quedar un pendiente que obligue a esperar para reintentar
            db.RegistrosPendientes.Remove(pendiente);
            await db.SaveChangesAsync(ct);
            throw new ServicioNoDisponibleException(
                "No pudimos enviar el código a tu correo en este momento. Inténtalo de nuevo en unos minutos.");
        }
    }

    private DateTime ReenviarDesde(RegistroPendiente pendiente) =>
        pendiente.EnviadoEn.AddSeconds(_verificacion.SegundosEntreEnvios);

    private RegistroPendienteResponse RespuestaPendiente(RegistroPendiente pendiente) =>
        new(pendiente.Correo, pendiente.ExpiraEn, ReenviarDesde(pendiente));
}
