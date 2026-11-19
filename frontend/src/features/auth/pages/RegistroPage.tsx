import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import Campo from '../../../components/ui/Campo'
import Icono from '../../../components/ui/Icono'
import { useAuth } from '../useAuth'
export default function RegistroPage() {
  const { registrarse } = useAuth(),
    navegar = useNavigate()
  const [nombre, setNombre] = useState(''),
    [correo, setCorreo] = useState(''),
    [contrasena, setContrasena] = useState(''),
    [confirmar, setConfirmar] = useState(''),
    [error, setError] = useState(''),
    [enviando, setEnviando] = useState(false)
  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Escribe tu nombre.')
      return
    }
    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (contrasena !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await registrarse({
        nombre: nombre.trim(),
        correo: correo.trim(),
        contrasena,
      })
      navegar('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo crear la cuenta.',
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
      <h1>Tu próxima aventura empieza aquí</h1>
      <p className="auth-intro">
        Crea tu cuenta y descubre las rutas de Yucatán.
      </p>
      <nav className="auth-tabs" aria-label="Acceso a la cuenta">
        <Link to="/login">Iniciar sesión</Link>
        <Link className="activo" to="/registro" aria-current="page">
          Registrarme
        </Link>
      </nav>
      <form onSubmit={enviar}>
        <Campo
          etiqueta="Nombre"
          autoComplete="name"
          required
          maxLength={100}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <Campo
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          ayuda="Mínimo 8 caracteres."
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        <Campo
          etiqueta="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />
        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="boton boton--primario"
          type="submit"
          disabled={enviando}
        >
          {enviando ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
      <div className="auth-seguridad">
        <Icono nombre="escudo" />
        <p>
          Tu cuenta se crea en la API de BIIN. Los planes y favoritos de esta
          versión se guardan en tu dispositivo.
        </p>
      </div>
    </section>
  )
}
