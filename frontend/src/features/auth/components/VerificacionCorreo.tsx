import { useEffect, useState, type FormEvent } from 'react'
import Boton from '../../../components/ui/Boton'
import Campo from '../../../components/ui/Campo'
import type { RegistroPendiente } from '../../../types/auth'
import { useAuth } from '../useAuth'

interface VerificacionCorreoProps {
  pendiente: RegistroPendiente
  /** Regresa al formulario de registro con los datos ya escritos. */
  alVolver: () => void
  alVerificar: () => void
  alReenviar: (pendiente: RegistroPendiente) => void
}

function segundosRestantes(hasta: string, ahora: number): number {
  return Math.max(0, Math.ceil((new Date(hasta).getTime() - ahora) / 1000))
}

/**
 * Paso 2 del registro de viajero (RF01, CU-01): escribir el código que llegó al correo.
 * Si el correo no existe, el código nunca llega; el viajero puede volver y corregirlo.
 */
export default function VerificacionCorreo({ pendiente, alVolver, alVerificar, alReenviar }: VerificacionCorreoProps) {
  const { verificarRegistro, reenviarCodigo } = useAuth()

  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [ahora, setAhora] = useState(() => Date.now())
  const espera = segundosRestantes(pendiente.reenviarDesde, ahora)
  const esperando = espera > 0

  // Un tic por segundo mientras haya que esperar para reenviar
  useEffect(() => {
    if (!esperando) return
    const intervalo = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(intervalo)
  }, [esperando])

  async function confirmar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando) return

    const limpio = codigo.replace(/\s/g, '')
    setError(null)
    setAviso(null)

    if (!/^\d{6}$/.test(limpio)) {
      setError('Escribe los 6 dígitos del código que te enviamos.')
      return
    }

    setEnviando(true)
    try {
      await verificarRegistro({ correo: pendiente.correo, codigo: limpio })
      alVerificar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar el código.')
      setEnviando(false)
    }
  }

  async function reenviar() {
    if (enviando || espera > 0) return

    setError(null)
    setAviso(null)
    setEnviando(true)
    try {
      const nuevo = await reenviarCodigo(pendiente.correo)
      setAhora(Date.now())
      setCodigo('')
      setAviso('Te enviamos un código nuevo. El anterior ya no sirve.')
      alReenviar(nuevo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="pagina pagina--angosta">
      <h1>Confirma tu correo</h1>

      <p>
        Enviamos un código de 6 dígitos a <strong>{pendiente.correo}</strong>. Tu cuenta se crea cuando lo
        escribas aquí.
      </p>
      <p>
        <small>
          Si no llega en unos minutos, revisa la carpeta de spam o vuelve para corregir tu correo.
        </small>
      </p>

      <form onSubmit={confirmar} noValidate aria-busy={enviando}>
        <Campo
          id="verificacion-codigo"
          etiqueta="Código"
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          disabled={enviando}
          value={codigo}
          onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'verificacion-error' : undefined}
        />

        {error && (
          <p id="verificacion-error" className="mensaje-error" role="alert">
            {error}
          </p>
        )}
        {aviso && <p role="status">{aviso}</p>}

        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Confirmando…' : 'Confirmar y crear cuenta'}
        </Boton>
      </form>

      <p>
        <Boton type="button" variante="secundario" onClick={reenviar} disabled={enviando || espera > 0}>
          {espera > 0 ? `Reenviar código (${espera} s)` : 'Reenviar código'}
        </Boton>
      </p>

      <p>
        <Boton type="button" variante="secundario" onClick={alVolver} disabled={enviando}>
          Volver y corregir mis datos
        </Boton>
      </p>
    </section>
  )
}
