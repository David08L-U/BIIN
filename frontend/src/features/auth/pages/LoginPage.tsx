import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import Boton from '../../../components/ui/Boton'
import Campo from '../../../components/ui/Campo'
import { useAuth } from '../useAuth'

type CampoAcceso = 'correo' | 'contrasena'

export default function LoginPage() {
  const { iniciarSesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()

  const desde =
    (ubicacion.state as { desde?: string } | null)?.desde ?? '/'

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [campoConError, setCampoConError] =
    useState<CampoAcceso | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (enviando) return

    const formulario = e.currentTarget
    const correoLimpio = correo.trim()

    setError(null)
    setCampoConError(null)

    function mostrarError(campo: CampoAcceso, mensaje: string) {
      setError(mensaje)
      setCampoConError(campo)

      const entrada = formulario.elements.namedItem(campo)

      if (entrada instanceof HTMLInputElement) {
        entrada.focus()
      }
    }

    if (!correoLimpio) {
      mostrarError('correo', 'Escribe tu correo electrónico.')
      return
    }

    const entradaCorreo = formulario.elements.namedItem('correo')

    if (
      entradaCorreo instanceof HTMLInputElement &&
      entradaCorreo.validity.typeMismatch
    ) {
      mostrarError('correo', 'Escribe un correo electrónico válido.')
      return
    }

    if (!contrasena) {
      mostrarError('contrasena', 'Escribe tu contraseña.')
      return
    }

    setEnviando(true)

    try {
      await iniciarSesion({
        correo: correoLimpio,
        contrasena,
      })

      navegar(desde, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="pagina pagina--angosta">
      <h1>Iniciar sesión</h1>

      <form
        onSubmit={enviar}
        noValidate
        aria-busy={enviando}
      >
        <Campo
          etiqueta="Correo"
          name="correo"
          type="email"
          autoComplete="email"
          required
          disabled={enviando}
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          aria-invalid={campoConError === 'correo' || undefined}
          aria-describedby={
            campoConError === 'correo' ? 'login-error' : undefined
          }
        />

        <Campo
          etiqueta="Contraseña"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          required
          disabled={enviando}
          value={contrasena}
          onChange={e => setContrasena(e.target.value)}
          aria-invalid={campoConError === 'contrasena' || undefined}
          aria-describedby={
            campoConError === 'contrasena'
              ? 'login-error'
              : undefined
          }
        />

        {error && (
          <p
            id="login-error"
            className="mensaje-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Boton>
      </form>

      <p>
        ¿No tienes cuenta?{' '}
        <Link to="/registro">Regístrate</Link>
      </p>
    </section>
  )
}