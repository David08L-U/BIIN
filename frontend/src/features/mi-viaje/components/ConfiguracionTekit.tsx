import { cambiarModalidadTekit } from '../plan/borradorTekit'
import { esModalidadTekit, modalidadesTekit } from '../plan/itinerarioTekit'
import type { BorradorTekit } from '../plan/itinerarioTekit'
import Icono from './IconoItinerario'

export default function ConfiguracionTekit({ borrador, onChange }: { borrador: BorradorTekit; onChange: (b: BorradorTekit) => void }) {
  const c = borrador.configuracion
  const cambiar = (campo: 'fecha' | 'horaInicio' | 'minutosDisponibles', valor: string) => onChange({ ...borrador, generado: false, configuracion: { ...c, [campo]: valor } })
  return <fieldset className="iz-plan-config iz-plan-tarjeta">
    <legend><Icono nombre="edit_calendar" tamano={18} />Configura tu visita</legend>
    <label>Estancia o modalidad<select value={esModalidadTekit(c.estancia) ? c.estancia : ''} onChange={e => onChange(cambiarModalidadTekit(borrador, e.target.value))} required>
      <option value="" disabled>Elige una modalidad</option>
      {Object.entries(modalidadesTekit).map(([id, v]) => <option key={id} value={id}>{v.nombre}</option>)}
    </select></label>
    <div className="iz-plan-campos">
      <label>Fecha de visita<input type="date" required value={c.fecha} onChange={e => cambiar('fecha', e.target.value)} /></label>
      <label>Hora de inicio<input type="time" required value={c.horaInicio} onChange={e => cambiar('horaInicio', e.target.value)} /></label>
      <label>Tiempo disponible (minutos)<input type="number" inputMode="numeric" min="15" max="720" step="1" required value={c.minutosDisponibles} onChange={e => cambiar('minutosDisponibles', e.target.value)} aria-describedby="tk-tiempo-ayuda" /></label>
    </div>
    <p id="tk-tiempo-ayuda">{c.estancia === 'ruta-textil' ? 'Ruta Textil · Compras no tiene duración fija. Indica cuánto tiempo tienes.' : 'Tiempo editable; incluye visitas, traslados, regreso y 15 minutos de margen.'}</p>
    <p>Fecha y hora en la zona local de este navegador. El inicio y el regreso son tus objetivos; confirma el transporte por separado.</p>
  </fieldset>
}
