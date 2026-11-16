import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import Boton from '../../../components/ui/Boton'
import Campo from '../../../components/ui/Campo'
import { useAuth } from '../useAuth'

export default function RegistroPage() {
  const { registrarse } = useAuth()
  const navegar = useNavigate()

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setError(null)
    setEnviando(true)
    try {
      await registrarse({ nombre, correo, contrasena })
      navegar('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="pagina pagina--angosta">
      <h1>Crear cuenta</h1>
      <form onSubmit={enviar} noValidate>
        <Campo etiqueta="Nombre" autoComplete="name" required
          value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Campo etiqueta="Correo" type="email" autoComplete="email" required
          value={correo} onChange={(e) => setCorreo(e.target.value)} />
        <Campo etiqueta="Contraseña" type="password" autoComplete="new-password" required minLength={8}
          ayuda="Mínimo 8 caracteres."
          value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        {error && <p className="mensaje-error" role="alert">{error}</p>}
        <Boton type="submit" disabled={enviando}>{enviando ? 'Creando…' : 'Crear cuenta'}</Boton>
      </form>
      <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </section>
  )
}
