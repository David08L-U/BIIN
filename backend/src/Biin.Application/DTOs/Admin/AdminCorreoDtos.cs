using System.ComponentModel.DataAnnotations;

namespace Biin.Application.DTOs.Admin;

/// <summary>Estado visible de la configuración de correo sin exponer credenciales (RF01, RNF04).</summary>
public record EstadoCorreoDto(
    bool Configurado,
    string Modo,
    string? Servidor,
    int Puerto,
    bool UsarSsl,
    string? Remitente,
    int TimeoutSegundos,
    bool ConfiguracionValida,
    IReadOnlyList<string> Observaciones);

public record PruebaCorreoRequest(
    [Required(ErrorMessage = "El correo de destino es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo de destino no tiene un formato válido.")]
    [StringLength(254, ErrorMessage = "El correo es demasiado largo.")]
    string CorreoDestino);

public record PruebaCorreoResultadoDto(
    string CorreoDestino,
    string Servidor,
    int Puerto,
    DateTime EnviadoEnUtc);
