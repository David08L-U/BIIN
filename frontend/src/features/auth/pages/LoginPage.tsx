import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import Campo from '../../../components/ui/Campo'
import Icono from '../../../components/ui/Icono'
import { useAuth } from '../useAuth'
export default function LoginPage() {
  const { iniciarSesion } = useAuth(),
    navegar = useNavigate(),
    desde = (useLocation().state as { desde?: string } | null)?.desde ?? '/'
  const [correo, setCorreo] = useState(''),
    [contrasena, setContrasena] = useState(''),
    [mostrar, setMostrar] = useState(false),
    [error, setError] = useState(''),
    [enviando, setEnviando] = useState(false)
  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await iniciarSesion({ correo: correo.trim(), contrasena })
      navegar(desde, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo iniciar sesión.',
      )
    } finally {
      setEnviando(false)
    }
  }
  return (
    <section className="pagina auth-page">
      <div className="auth-barra">
        <Link className="icon-button" to="/" aria-label="Regresar al inicio">
          <Icono nombre="volver" />
        </Link>
        <span className="marca-minima">
          BIIN <span>●</span>
        </span>
      </div>
      <h1>Bienvenido a BIIN</h1>
      <p className="auth-intro">
        Tu movilidad y rutas intermunicipales de Yucatán en un solo lugar.
      </p>
      <nav className="auth-tabs" aria-label="Acceso a la cuenta">
        <Link className="activo" to="/login" aria-current="page">
          Iniciar sesión
        </Link>
        <Link to="/registro">Registrarme</Link>
      </nav>
      <form onSubmit={enviar}>
        <Campo
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          placeholder="ej. viajero@correo.com"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <div className="password-wrapper">
          <Campo
            etiqueta="Contraseña"
            type={mostrar ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Tu contraseña"
            required
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
          <button
            className="password-toggle"
            type="button"
            aria-pressed={mostrar}
            onClick={() => setMostrar(!mostrar)}
          >
            {mostrar ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="boton boton--primario"
          aria-label="Entrar"
          disabled={enviando}
          type="submit"
        >
          {enviando ? 'Entrando…' : 'Entrar a mi cuenta'}
        </button>
      </form>
      <p className="auth-alternativa">O EXPLORA YUCATÁN</p>
      <Link to="/" className="boton boton--secundario">
        Continuar como visitante
      </Link>
      <div className="auth-seguridad">
        <Icono nombre="escudo" />
        <div>
          <strong>Tu cuenta BIIN</strong>
          <p>
            La sesión se valida con el servidor del proyecto. Nunca compartas tu
            contraseña.
          </p>
          <small>
            Acceso con Google y recuperación de contraseña pendientes de
            integración.
          </small>
        </div>
      </div>
    </section>
  )
}
