namespace Biin.Api.Configuration;

/// <summary>
/// Nombres de políticas de autorización por rol y por recurso (RNF04).
/// Uso en controladores: <c>[Authorize(Policy = PoliticasAutorizacion.RequiereAdministrador)]</c>.
/// Los endpoints de consulta pública (RF01: rutas, lugares, negocios, eventos) deben llevar <c>[AllowAnonymous]</c>.
/// </summary>
public static class PoliticasAutorizacion
{
    /// <summary>Viajero registrado: perfil, favoritos (CU-10) e itinerarios (CU-09).</summary>
    public const string RequiereViajero = "RequiereViajero";

    /// <summary>Conductor o checador autorizado: reporte de cupo (CU-04).</summary>
    public const string RequiereOperador = "RequiereOperador";

    /// <summary>Administrador: gestión de contenidos, usuarios y roles (CU-12).</summary>
    public const string RequiereAdministrador = "RequiereAdministrador";

    /// <summary>Operación de transporte compartida entre operador y administrador.</summary>
    public const string RequiereOperadorOAdministrador = "RequiereOperadorOAdministrador";

    /// <summary>Propuesta y gestión de contenidos (preparado para flujo de colaboradores T08).</summary>
    public const string RequiereColaboradorOAdministrador = "RequiereColaboradorOAdministrador";

    /// <summary>Autorización basada en recurso: operador asignado a una ruta en <c>operador_ruta</c> (CU-04).</summary>
    public const string OperadorDeRuta = "OperadorDeRuta";
}
