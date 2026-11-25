import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import Boton from '../../../components/ui/Boton'
import Campo from '../../../components/ui/Campo'
import { useAuth } from '../useAuth'

type CampoRegistro = 'nombre' | 'correo' | 'contrasena'

export default function RegistroPage() {
  const { registrarse } = useAuth()
  const navegar = useNavigate()

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [campoConError, setCampoConError] =
    useState<CampoRegistro | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (enviando) return

    const formulario = e.currentTarget
    const nombreLimpio = nombre.trim()
    const correoLimpio = correo.trim()

    setError(null)
    setCampoConError(null)

    function mostrarError(campo: CampoRegistro, mensaje: string) {
      setError(mensaje)
      setCampoConError(campo)

      const entrada = formulario.elements.namedItem(campo)

      if (entrada instanceof HTMLInputElement) {
        entrada.focus()
      }
    }

    if (!nombreLimpio) {
      mostrarError('nombre', 'Escribe tu nombre.')
      return
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
      mostrarError('contrasena', 'Escribe una contraseña.')
      return
    }

    if (contrasena.length < 8) {
      mostrarError(
        'contrasena',
        'La contraseña debe tener al menos 8 caracteres.',
      )
      return
    }

    setEnviando(true)

    try {
      await registrarse({
        nombre: nombreLimpio,
        correo: correoLimpio,
        contrasena,
      })

      navegar('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo crear la cuenta.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="pagina pagina--angosta">
      <h1>Crear cuenta</h1>

      <form
        onSubmit={enviar}
        noValidate
        aria-busy={enviando}
      >
        <Campo
          id="registro-nombre"
          etiqueta="Nombre"
          name="nombre"
          autoComplete="name"
          required
          disabled={enviando}
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          aria-invalid={campoConError === 'nombre' || undefined}
          aria-describedby={
            campoConError === 'nombre' ? 'registro-error' : undefined
          }
        />

        <Campo
          id="registro-correo"
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
            campoConError === 'correo' ? 'registro-error' : undefined
          }
        />

        <Campo
          id="registro-contrasena"
          etiqueta="Contraseña"
          name="contrasena"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          ayuda="Mínimo 8 caracteres."
          disabled={enviando}
          value={contrasena}
          onChange={e => setContrasena(e.target.value)}
          aria-invalid={campoConError === 'contrasena' || undefined}
          aria-describedby={
            campoConError === 'contrasena'
              ? 'registro-contrasena-ayuda registro-error'
              : 'registro-contrasena-ayuda'
          }
        />

        {error && (
          <p
            id="registro-error"
            className="mensaje-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Creando…' : 'Crear cuenta'}
        </Boton>
      </form>

      <p>
        ¿Ya tienes cuenta?{' '}
        <Link to="/login">Inicia sesión</Link>
      </p>
    </section>
  )
}