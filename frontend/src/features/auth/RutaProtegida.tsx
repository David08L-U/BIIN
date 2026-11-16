import { Navigate, Outlet, useLocation } from 'react-router'
import type { Rol } from '../../types/auth'
import { useAuth } from './useAuth'

/** Pide sesión (y opcionalmente un rol). La validación real ocurre en el backend. */
export default function RutaProtegida({ roles }: { roles?: Rol[] }) {
  const { usuario, cargando, tieneRol } = useAuth()
  const ubicacion = useLocation()

  if (cargando) return <p className="estado">Cargando…</p>
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
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
