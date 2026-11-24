import { useId } from 'react'
import { cambiarModalidadTicul } from '../plan/borradorTicul'
import { esModalidadTicul, modalidadesTicul } from '../plan/itinerarioTicul'
import type { BorradorTicul } from '../plan/itinerarioTicul'
import Icono from './IconoItinerario'

export default function ConfiguracionTicul({ borrador, onChange }: { borrador: BorradorTicul; onChange: (b: BorradorTicul) => void }) {
  const ayudaId = useId()
  const c = borrador.configuracion
  const cambiar = (campo: 'fecha' | 'horaInicio' | 'minutosDisponibles', valor: string) => onChange({ ...borrador, generado: false, configuracion: { ...c, [campo]: valor } })
  return <fieldset className="ti-config ti-tarjeta">
    <legend><Icono nombre="edit_calendar" tamano={20} />Configura tu visita</legend>
    <label>Estancia o modalidad<select required value={esModalidadTicul(c.estancia) ? c.estancia : ''} onChange={e => onChange(cambiarModalidadTicul(borrador, e.target.value))}>
      <option value="" disabled>Elige una modalidad</option>{Object.entries(modalidadesTicul).map(([id, v]) => <option key={id} value={id}>{v.nombre}</option>)}
    </select></label>
    <div className="ti-campos"><label>Fecha de visita<input type="date" required value={c.fecha} onChange={e => cambiar('fecha', e.target.value)} /></label><label>Hora de inicio<input type="time" required value={c.horaInicio} onChange={e => cambiar('horaInicio', e.target.value)} /></label><label>Tiempo disponible (minutos)<input type="number" inputMode="numeric" min="15" max="720" step="1" required value={c.minutosDisponibles} onChange={e => cambiar('minutosDisponibles', e.target.value)} aria-describedby={ayudaId} /></label></div>
    <p id={ayudaId}>{c.estancia === 'medio-dia' ? 'Tiempo editable; incluye visitas, traslados, regreso y 15 min de margen.' : 'Esta modalidad no tiene duración fija. Indica cuánto tiempo tienes.'}</p>
    {c.estancia === 'dia-completo' && <p>Ruta Puuc: esta propuesta incluye solo las referencias de Ticul, sin excursiones a otras localidades.</p>}
    {c.estancia === 'tour-compras' && <p>El recomendado prioriza alfarería y calzado. Puedes elegir otras categorías al personalizar.</p>}
    <p>Fecha y hora en la zona local de este navegador. Inicio y regreso son tus objetivos; confirma el transporte por separado.</p>
  </fieldset>
}
