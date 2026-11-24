import { cambiarEstanciaValladolid } from '../plan/borradorValladolid'
import { esEstanciaValladolid, estanciasValladolid, ventanasValladolid } from '../plan/itinerarioValladolid'
import type { BorradorValladolid } from '../plan/itinerarioValladolid'
import Icono from './IconoItinerario'

export default function ConfiguracionValladolid({ borrador, onChange }: { borrador: BorradorValladolid; onChange: (borrador: BorradorValladolid) => void }) {
  const config = borrador.configuracion
  const cambiar = (campo: keyof typeof config, valor: string) => onChange({ ...borrador, generado: false, configuracion: { ...config, [campo]: valor } })
  return <fieldset className="va-config">
    <legend><Icono nombre="edit_calendar" tamano={20} />Configura tu visita</legend>
    <p>Plan estimado · Fecha y hora en la zona local de este navegador.</p>
    <div className="va-campos">
      <label>Estancia<select value={config.estancia} onChange={e => { if (esEstanciaValladolid(e.target.value)) onChange(cambiarEstanciaValladolid(borrador, e.target.value)) }}>
        {!esEstanciaValladolid(config.estancia) && <option value={config.estancia}>Selecciona una estancia válida</option>}
        {Object.entries(estanciasValladolid).map(([id, opcion]) => <option key={id} value={id}>{opcion.nombre}</option>)}
      </select></label>
      <label>Fecha de visita<input type="date" required value={config.fecha} onChange={e => cambiar('fecha', e.target.value)} /></label>
    </div>
    {ventanasValladolid(config).map(ventana => <fieldset className="va-ventana" key={ventana.dia}>
      <legend>Día {ventana.dia}{ventana.fecha && ` · ${ventana.fecha}`}</legend>
      {ventana.dia === 2 && <label>Fecha del Día 2<input type="date" value={ventana.fecha} readOnly /><span>Fecha consecutiva calculada por calendario local.</span></label>}
      <div className="va-campos">
        <label>Hora de inicio del Día {ventana.dia}<input type="time" required min="06:00" max="22:00" value={ventana.horaInicio} onChange={e => cambiar(ventana.dia === 1 ? 'horaInicio' : 'horaInicioDia2', e.target.value)} /></label>
        <label>Tiempo disponible del Día {ventana.dia} (minutos)<input type="number" inputMode="numeric" min="15" max="720" step="1" required value={ventana.minutosDisponibles} onChange={e => cambiar(ventana.dia === 1 ? 'minutosDisponibles' : 'minutosDia2', e.target.value)} /></label>
      </div>
    </fieldset>)}
    <p>Inicio y regreso son objetivos tuyos; transporte sin confirmar. Ventanas de 06:00 a 22:00 como límite del planificador, sin acreditar aperturas. Cada jornada incluye traslado final y 15 min de margen.</p>
    {config.estancia === 'fin-de-semana' && <p>Dos jornadas independientes, sin actividades nocturnas, alojamiento ni transporte entre días. Al pasar a una sola jornada, todas las visitas elegidas se asignan al Día 1 y debes generar de nuevo.</p>}
  </fieldset>
}
