import { useId } from 'react'
import { cambiarEstanciaHomun } from '../plan/borradorHomun'
import { esEstanciaHomun, estanciasHomun, ventanasHomun } from '../plan/itinerarioHomun'
import type { BorradorHomun } from '../plan/itinerarioHomun'
import Icono from './IconoItinerario'

export default function ConfiguracionHomun({ borrador, onChange }: { borrador: BorradorHomun; onChange: (b: BorradorHomun) => void }) {
  const fechaDia2Id = useId()
  const ayudaFechaDia2Id = `${fechaDia2Id}-ayuda`
  const c = borrador.configuracion
  const cambiar = (campo: keyof typeof c, valor: string) => onChange({ ...borrador, generado: false, configuracion: { ...c, [campo]: valor } })
  return <fieldset className="iz-plan-config iz-plan-tarjeta">
    <legend><Icono nombre="edit_calendar" tamano={20} />Configura tu visita</legend>
    <p>Plan estimado · Fecha y hora en la zona local de este navegador.</p>
    <div className="iz-plan-campos"><label>Estancia<select value={esEstanciaHomun(c.estancia) ? c.estancia : ''} required onChange={e => { if (esEstanciaHomun(e.target.value)) onChange(cambiarEstanciaHomun(borrador, e.target.value)) }}>
      <option value="" disabled>Selecciona una estancia válida</option>{Object.entries(estanciasHomun).map(([id, v]) => <option key={id} value={id}>{v.nombre}</option>)}
    </select></label><label>Fecha de visita<input type="date" required value={c.fecha} onChange={e => cambiar('fecha', e.target.value)} /></label></div>
    {ventanasHomun(c).map(v => <fieldset key={v.dia} className="iz-plan-ventana">
      <legend>Día {v.dia}{v.fecha && ` · ${v.fecha}`}</legend>
      {v.dia === 2 && <div className="iz-plan-fecha-automatica">
        <label htmlFor={fechaDia2Id}>Fecha del Día 2<input id={fechaDia2Id} type="date" readOnly value={v.fecha} aria-describedby={ayudaFechaDia2Id} /></label>
        <p id={ayudaFechaDia2Id}>Fecha consecutiva calculada por calendario local.</p>
      </div>}
      <div className="iz-plan-campos"><label>Hora de inicio del Día {v.dia}<input type="time" min="06:00" max="22:00" required value={v.horaInicio} onChange={e => cambiar(v.dia === 1 ? 'horaInicio' : 'horaInicioDia2', e.target.value)} /></label><label>Tiempo disponible del Día {v.dia} (minutos)<input type="number" inputMode="numeric" min="15" max="720" step="1" required value={v.minutosDisponibles} onChange={e => cambiar(v.dia === 1 ? 'minutosDisponibles' : 'minutosDia2', e.target.value)} /></label></div>
    </fieldset>)}
    <p>Ventanas entre 06:00 y 22:00 como límite del planificador, sin acreditar aperturas. Cada jornada incluye regreso final estimado y 15 min de margen.</p>
    {c.estancia === 'fin-de-semana' && <p>Dos jornadas independientes, sin actividades nocturnas ni transporte o alojamiento entre días. Al pasar a una jornada, las visitas se asignan al Día 1 y debes generar de nuevo.</p>}
  </fieldset>
}
