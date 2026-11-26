namespace Biin.Domain.Exceptions;

/// <summary>Una regla de negocio no se cumplió (responde 400).</summary>
public class ReglaNegocioException(string mensaje) : Exception(mensaje);

/// <summary>El registro solicitado no existe (responde 404).</summary>
public class NoEncontradoException(string mensaje) : Exception(mensaje);

/// <summary>El dato ya existe, por ejemplo un correo repetido (responde 409).</summary>
public class ConflictoException(string mensaje) : Exception(mensaje);

/// <summary>El usuario no tiene permiso sobre ese registro (responde 403).</summary>
public class AccesoDenegadoException(string mensaje) : Exception(mensaje);

/// <summary>Credenciales incorrectas o cuenta inactiva (responde 401).</summary>
public class NoAutenticadoException(string mensaje) : Exception(mensaje);

/// <summary>Un servicio externo necesario (por ejemplo, el correo) no respondió (responde 503).</summary>
public class ServicioNoDisponibleException(string mensaje) : Exception(mensaje);
