import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'

export default function Layout() {
  const { usuario, cerrarSesion, tieneRol } = useAuth()

  return (
    <div className="app">
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <header className="encabezado">
        <Link to="/" className="marca">BIIN</Link>
        <nav aria-label="Principal">
          <NavLink to="/" end>Rutas</NavLink>
          <NavLink to="/explorar">Explorar</NavLink>
          <NavLink to="/recorridos">Recorridos</NavLink>
          <NavLink to="/asistente">Asistente</NavLink>
          {usuario && <NavLink to="/mi-viaje">Mi viaje</NavLink>}
          {tieneRol('operador') && <NavLink to="/cupo">Cupo</NavLink>}
          {tieneRol('administrador') && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="sesion">
          {usuario ? (
            <>
              <span className="sesion__nombre">{usuario.nombre}</span>
              <button type="button" className="enlace" onClick={cerrarSesion}>Salir</button>
            </>
          ) : (
            <NavLink to="/login">Entrar</NavLink>
          )}
        </div>
      </header>
      <main id="contenido">
        <Outlet />
      </main>
    </div>
  )
}
