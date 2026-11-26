import { Navigate, Outlet, useLocation } from 'react-router'
import type { Rol } from '../../types/auth'
import { useAuth } from './useAuth'

/** Pide sesión y, opcionalmente, un rol. */
export default function RutaProtegida({
  roles,
}: {
  roles?: Rol[]
}) {
  const { usuario, cargando, tieneRol, errorRestauracion, reintentarRestauracion, cerrarSesion } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return <p className="estado">Cargando…</p>
  }

  if (errorRestauracion) {
    return (
      <section className="pagina" role="alert" aria-live="assertive">
        <h1>Tu sesión no está disponible</h1>
        <p>{errorRestauracion}</p>
        <button type="button" onClick={() => void reintentarRestauracion()}>
          Reintentar
        </button>
        <button type="button" onClick={cerrarSesion}>
          Volver a iniciar sesión
        </button>
      </section>
    )
  }

  if (!usuario) {
    const desde =
      ubicacion.pathname + ubicacion.search + ubicacion.hash

    return (
      <Navigate
        to="/login"
        replace
        state={{ desde }}
      />
    )
  }

  if (roles && !roles.some(tieneRol)) {
    return (
      <section className="pagina">
        <h1>Sin permiso</h1>
        <p>Tu cuenta no tiene acceso a esta sección.</p>
      </section>
    )
  }

  return <Outlet />
}
