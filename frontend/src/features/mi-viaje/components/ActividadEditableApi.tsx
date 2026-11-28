import { useState, type FormEvent } from 'react'
import type { ActividadItinerarioDto, ActualizarActividadRequest } from '../api'
import { aUtcYucatan, entradaYucatan, fechaHora } from '../../../utils/formatoDatos'

export default function ActividadEditableApi({ actividad, disabled, guardar }: { actividad: ActividadItinerarioDto; disabled: boolean; guardar: (datos: ActualizarActividadRequest) => void }) {
  const [inicio, setInicio] = useState(actividad.inicioPrevisto ? entradaYucatan(actividad.inicioPrevisto) : '')
  const [fin, setFin] = useState(actividad.finPrevisto ? entradaYucatan(actividad.finPrevisto) : '')
  const [notas, setNotas] = useState(actividad.notas ?? '')
  const [error, setError] = useState('')
  function enviar(e: FormEvent) {
    e.preventDefault()
    const inicioUtc = inicio ? aUtcYucatan(inicio) : null
    const finUtc = fin ? aUtcYucatan(fin) : null
    if ((inicio && !inicioUtc) || (fin && !finUtc) || (inicioUtc && finUtc && finUtc <= inicioUtc)) { setError('Revisa las fechas: el final debe ser posterior al inicio.'); return }
    setError(''); guardar({ inicioPrevisto: inicioUtc, finPrevisto: finUtc, notas: notas.trim() || null })
  }
  return <form className="formulario-api" onSubmit={enviar} noValidate><fieldset disabled={disabled}><legend>Horarios y notas de {actividad.titulo}</legend>
    <p>Horario previsto: {fechaHora(actividad.inicioPrevisto)} — {fechaHora(actividad.finPrevisto)}</p>
    <label>Inicio en Yucatán<input type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)} /></label><label>Fin en Yucatán<input type="datetime-local" value={fin} onChange={e => setFin(e.target.value)} /></label>
    <label>Notas<textarea maxLength={500} value={notas} onChange={e => setNotas(e.target.value)} /></label>
    {error && <p role="alert">{error}</p>}<button type="submit">Guardar actividad</button>
  </fieldset></form>
}
