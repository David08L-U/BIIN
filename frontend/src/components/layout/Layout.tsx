import { useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'
import '../../styles/melanie.css'

export default function Layout() {
  const { usuario, cerrarSesion, tieneRol } = useAuth()
  const { pathname } = useLocation()
  const menu = useRef<HTMLDialogElement>(null)

  const abrirMenu = () => menu.current?.showModal()
  const cerrarMenu = () => menu.current?.close()

  const esAcceso = pathname === '/login' || pathname === '/registro'
  const esFlujoIzamal = /^\/rutas\/izamal(?:\/(?:itinerario|personalizar))?\/?$/.test(pathname)
  const esDetalleValladolid = /^\/rutas\/valladolid\/?$/.test(pathname)
  const esDetalleTekit = /^\/rutas\/tekit\/?$/.test(pathname)
  const esDetalleHomun = /^\/rutas\/homun\/?$/.test(pathname)
  const esDetalleTicul = /^\/rutas\/ticul\/?$/.test(pathname)

  if (esAcceso) {
    return (
      <main id="contenido" className="biin-acceso">
        <Outlet />
      </main>
    )
  }

  return (
    <div className="biin-shell">
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>

      {pathname !== '/' && pathname !== '/rutas' && !esFlujoIzamal && !esDetalleValladolid && !esDetalleTekit && !esDetalleHomun && !esDetalleTicul && (
        <header className="biin-cabecera-simple">
          <button
            className="biin-icon-button"
            onClick={abrirMenu}
            aria-label="Abrir menú"
          >
            <span aria-hidden="true" className="biin-icon">menu</span>
          </button>

          <Link className="marca" to="/">BIIN</Link>

          <Link to={usuario ? '/perfil' : '/login'}>
            {usuario ? usuario.nombre : 'Entrar'}
          </Link>
        </header>
      )}

      <main id="contenido" className="biin-contenido">
        <Outlet context={{ abrirMenu }} />
      </main>

      <nav className="biin-nav" aria-label="Navegación principal">
        <NavLink to="/" end>
          <span aria-hidden="true" className="biin-icon">home</span>
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/rutas">
          <span aria-hidden="true" className="biin-icon">route</span>
          <span>Rutas</span>
        </NavLink>

        <NavLink to="/explorar">
          <span aria-hidden="true" className="biin-icon">explore</span>
          <span>Explorar</span>
        </NavLink>

        <NavLink to="/mi-viaje">
          <span aria-hidden="true" className="biin-icon">event_note</span>
          <span>Mi viaje</span>
        </NavLink>

        <NavLink to="/perfil">
          <span aria-hidden="true" className="biin-icon">person</span>
          <span>Perfil</span>
        </NavLink>
      </nav>

      <dialog
        ref={menu}
        className="biin-menu"
        aria-label="Menú BIIN"
        onClick={e => {
          if (e.target === e.currentTarget) cerrarMenu()
        }}
      >
        <div className="biin-menu-top">
          <strong className="marca">BIIN</strong>

          <button
            className="biin-icon-button"
            onClick={cerrarMenu}
            aria-label="Cerrar menú"
          >
            <span aria-hidden="true" className="biin-icon">close</span>
          </button>
        </div>

        <p className="biin-menu-saludo">
          {usuario
            ? `Hola, ${usuario.nombre}`
            : 'Tu guía para viajar por Yucatán'}
        </p>

        <nav aria-label="Menú lateral" onClick={cerrarMenu}>
          <Link to="/">Inicio / mapa</Link>
          <Link to="/rutas">Explorar rutas</Link>
          <Link to="/explorar">Explorar Yucatán</Link>
          <Link to="/recorridos">Recorridos sugeridos</Link>
          <Link to="/mi-viaje">Mi viaje</Link>
          <Link to="/perfil">Mi perfil</Link>
          <Link to="/asistente">Asistente BIIN</Link>

          {tieneRol('operador') && (
            <Link to="/cupo">Reportar cupo</Link>
          )}

          {tieneRol('administrador') && (
            <Link to="/admin">Administración</Link>
          )}
        </nav>

        {usuario ? (
          <button
            className="biin-menu-sesion"
            onClick={() => {
              cerrarSesion()
              cerrarMenu()
            }}
          >
            Cerrar sesión
          </button>
        ) : (
          <Link
            className="biin-menu-sesion"
            to="/login"
            onClick={cerrarMenu}
          >
            Iniciar sesión
          </Link>
        )}
      </dialog>
    </div>
  )
}
