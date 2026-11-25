import { useId, useState } from 'react'
import { duracionPlan, leerDuracion, maximoDuracion, minimoDuracion } from '../plan/duracion'

function separar(valor: string) {
  const total = Number(valor)
  if (!/^\d+$/.test(valor) || !Number.isSafeInteger(total)) return { horas: '', minutos: '' }
  return { horas: String(Math.floor(total / 60)), minutos: String(total % 60) }
}

function validar(horas: string, minutos: string) {
  if (!horas || !minutos) return 'Completa las horas y los minutos.'
  if (!/^\d+$/.test(horas)) return 'Las horas deben ser un número entero no negativo.'
  if (!/^\d+$/.test(minutos) || Number(minutos) > 59) return 'Los minutos deben ser un número entero entre 0 y 59.'
  const total = String(Number(horas) * 60 + Number(minutos))
  return leerDuracion(total) !== null
    ? ''
    : `El tiempo disponible debe estar entre ${duracionPlan(minimoDuracion)} y ${duracionPlan(maximoDuracion)}.`
}

export default function CampoDuracion({ valor, onChange, dia, ayuda }: {
  valor: string
  onChange: (minutos: string) => void
  dia?: number
  ayuda?: string
}) {
  const id = useId()
  const inicial = () => ({ valor, ...separar(valor), editado: false })
  // La URL recibe un vacío mientras hay una edición parcial. Conserva los dos
  // campos mientras el usuario edita y sincronízalos cuando llega otro total.
  const [edicion, setEdicion] = useState(inicial)
  const actual = edicion.valor === valor ? edicion : inicial()
  if (actual !== edicion) setEdicion(actual)
  const error = actual.editado || valor ? validar(actual.horas, actual.minutos) : ''
  const descripcion = ayuda ? `${id} ${ayuda}` : id

  function cambiar(campo: 'horas' | 'minutos', contenido: string) {
    const siguiente = { ...actual, [campo]: contenido, editado: true }
    const total = validar(siguiente.horas, siguiente.minutos)
      ? ''
      : String(Number(siguiente.horas) * 60 + Number(siguiente.minutos))
    setEdicion({ ...siguiente, valor: total })
    onChange(total)
  }

  const jornada = dia === undefined ? '' : ` del Día ${dia}`

  return <fieldset className="iz-plan-duracion-campo">
    <legend>Tiempo disponible{jornada}</legend>
    <label>
      Horas
      <input type="number" inputMode="numeric" min="0" max={Math.floor(maximoDuracion / 60)} step="1" required
        aria-label={`Horas${jornada}`} aria-invalid={!!error} aria-describedby={descripcion}
        value={actual.horas} onChange={e => cambiar('horas', e.target.value)} />
    </label>
    <label>
      Minutos
      <input type="number" inputMode="numeric" min="0" max="59" step="1" required
        aria-label={`Minutos${jornada}`} aria-invalid={!!error} aria-describedby={descripcion}
        value={actual.minutos} onChange={e => cambiar('minutos', e.target.value)} />
    </label>
    <p id={id} aria-live="polite">{error}</p>
  </fieldset>
}
