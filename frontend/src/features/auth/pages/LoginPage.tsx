import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import Boton from '../../../components/ui/Boton'
import Campo from '../../../components/ui/Campo'
import { useAuth } from '../useAuth'

export default function LoginPage() {
  const { iniciarSesion } = useAuth()
  const navegar = useNavigate()
  const desde = (useLocation().state as { desde?: string } | null)?.desde ?? '/'

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesion({ correo, contrasena })
      navegar(desde, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="pagina pagina--angosta">
      <h1>Iniciar sesión</h1>
      <form onSubmit={enviar} noValidate>
        <Campo etiqueta="Correo" type="email" autoComplete="email" required
          value={correo} onChange={(e) => setCorreo(e.target.value)} />
        <Campo etiqueta="Contraseña" type="password" autoComplete="current-password" required
          value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        {error && <p className="mensaje-error" role="alert">{error}</p>}
        <Boton type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</Boton>
      </form>
      <p>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
    </section>
  )
}
