import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import Boton from '../../../components/ui/Boton'
import Campo from '../../../components/ui/Campo'
import LogoBiin from '../../../components/ui/LogoBiin'
import { destinoTrasAcceso } from '../../../utils/navegacion'
import { useAuth } from '../useAuth'
import '../../../styles/auth.css'

type CampoAcceso = 'correo' | 'contrasena'

export default function LoginPage() {
  const { iniciarSesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()

  const desde = destinoTrasAcceso(
    (ubicacion.state as { desde?: string } | null)?.desde,
  )

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [campoConError, setCampoConError] =
    useState<CampoAcceso | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [avisoIntegracion, setAvisoIntegracion] = useState<string | null>(null)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (enviando) return

    const formulario = e.currentTarget
    const correoLimpio = correo.trim()

    setError(null)
    setAvisoIntegracion(null)
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
    <section className="pagina pagina--angosta auth-page" aria-labelledby="login-titulo">
      <header className="auth-cabecera">
        <LogoBiin tamaño="acceso" />
        <h1 id="login-titulo">Ingresa a tu cuenta</h1>
      </header>

      <form
        onSubmit={enviar}
        noValidate
        aria-busy={enviando}
      >
        <Campo
          etiqueta="Correo electrónico"
          icono="mail"
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
          icono="lock"
          name="contrasena"
          type={mostrarContrasena ? 'text' : 'password'}
          autoComplete="current-password"
          required
          disabled={enviando}
          value={contrasena}
          onChange={e => setContrasena(e.target.value)}
          accion={{
            etiqueta: mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña',
            activa: mostrarContrasena,
            alActivar: () => setMostrarContrasena(actual => !actual),
            icono: mostrarContrasena ? 'visibility_off' : 'visibility',
          }}
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

        <button type="button" className="auth-enlace auth-recuperacion" onClick={() => setAvisoIntegracion('La recuperación de contraseña está pendiente de integración.')}>¿Olvidaste tu contraseña?</button>

        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Boton>

        <div className="auth-separador" aria-hidden="true"><span>O continúa con</span></div>
        <button type="button" className="auth-google" onClick={() => setAvisoIntegracion('El acceso con Google está pendiente de integración.')}>
          <span className="auth-google-icon" aria-hidden="true">G</span> Google
        </button>
      </form>

      {avisoIntegracion && <p className="auth-aviso" role="status" aria-live="polite">{avisoIntegracion}</p>}

      <p className="auth-cambiar">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" state={{ desde }}>
          Crear cuenta
        </Link>
      </p>
    </section>
  )
}
