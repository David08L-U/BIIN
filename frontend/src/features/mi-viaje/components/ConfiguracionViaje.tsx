import type { ConfiguracionViaje as Configuracion } from '../plan/itinerarioIzamal'
import { estanciasIzamal } from '../plan/itinerarioIzamal'
import Icono from './IconoItinerario'

export default function ConfiguracionViaje({ configuracion, onChange }: { configuracion: Configuracion; onChange: (config: Configuracion) => void }) {
  return (
    <fieldset className="iz-plan-config iz-plan-tarjeta">
      <legend><Icono nombre="edit_calendar" tamano={20} />Configura tu visita</legend>
      <p>Plan estimado · {estanciasIzamal[configuracion.estancia].nombre}. Fecha y hora en la zona local de este navegador.</p>
      <div className="iz-plan-campos">
        <label>Fecha de visita<input type="date" required value={configuracion.fecha} onChange={e => onChange({ ...configuracion, fecha: e.target.value })} /></label>
        <label>Hora de inicio<input type="time" required value={configuracion.horaInicio} onChange={e => onChange({ ...configuracion, horaInicio: e.target.value })} /></label>
        <label>Tiempo disponible (minutos)<input type="number" inputMode="numeric" min="15" max="720" step="1" required value={configuracion.minutosDisponibles} onChange={e => onChange({ ...configuracion, minutosDisponibles: e.target.value })} /></label>
      </div>
      <p>La hora es tu elección; no es una llegada confirmada de transporte.{configuracion.estancia === 'tarde-magica' && ' Tarde mágica inicia con 3 horas; no calcula un atardecer real.'}</p>
    </fieldset>
  )
}
