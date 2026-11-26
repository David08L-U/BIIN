import { useId, type ReactNode } from 'react'
import CampoDuracion from './CampoDuracion'
import Icono from './IconoItinerario'
import { fechaPasadaLocal, hoyLocal } from '../plan/tiempoLocal'

type Jornada = { dia: number; fecha: string; horaInicio: string; minutosDisponibles: string }

export default function ConfiguracionVisita({ estancia, opciones, etiqueta = 'Estancia', fecha, jornadas,
  horario, cambiarEstancia, cambiarFecha, cambiarHora, cambiarDuracion, ayudaDuracion, children }: {
  estancia: string
  opciones: Record<string, { nombre: string }>
  etiqueta?: string
  fecha: string
  jornadas: readonly Jornada[]
  horario?: { min: string; max: string }
  cambiarEstancia: (valor: string) => void
  cambiarFecha: (valor: string) => void
  cambiarHora: (dia: number, valor: string) => void
  cambiarDuracion: (dia: number, valor: string) => void
  ayudaDuracion?: string
  children?: ReactNode
}) {
  const ayudaId = useId()
  const fechasId = useId()
  const errorFechaId = useId()
  const errorFecha = fechaPasadaLocal(fecha) ? 'La fecha ya pasó. Elige hoy o un día futuro para generar tu itinerario.' : ''
  return <fieldset className="iz-plan-config">
    <legend><Icono nombre="edit_calendar" tamano={20} />Configura tu visita</legend>
    <p>Plan estimado · Fecha y hora en la zona local de este navegador.</p>
    <div className="iz-plan-campos">
      <label>{etiqueta}<select required value={estancia} onChange={e => cambiarEstancia(e.target.value)}>
        {!Object.hasOwn(opciones, estancia) && <option value={estancia} disabled>Selecciona una opción válida</option>}
        {Object.entries(opciones).map(([id, opcion]) => <option key={id} value={id}>{opcion.nombre}</option>)}
      </select></label>
      <label>Fecha de visita<input type="date" required min={hoyLocal()} value={fecha} onChange={e => cambiarFecha(e.target.value)} aria-invalid={Boolean(errorFecha)} aria-describedby={errorFecha ? errorFechaId : undefined} /></label>
    </div>
    {errorFecha && <p id={errorFechaId} className="iz-plan-error" role="alert">{errorFecha}</p>}
    {jornadas.map(jornada => <fieldset className="iz-plan-ventana" key={jornada.dia}>
      <legend>Día {jornada.dia}{jornada.fecha && ` · ${jornada.fecha}`}</legend>
      {jornada.dia > 1 && <div>
        <label htmlFor={`${fechasId}-${jornada.dia}`}>Fecha del Día {jornada.dia}
          <input id={`${fechasId}-${jornada.dia}`} type="date" min={hoyLocal()} value={jornada.fecha} readOnly
            aria-describedby={`${fechasId}-${jornada.dia}-ayuda`} />
        </label>
        <p id={`${fechasId}-${jornada.dia}-ayuda`} className="iz-plan-fecha-consecutiva">Fecha consecutiva calculada por calendario local.</p>
      </div>}
      <div className="iz-plan-campos">
        <label>Hora de inicio{horario && ` del Día ${jornada.dia}`}
          <input type="time" required {...horario} value={jornada.horaInicio} onChange={e => cambiarHora(jornada.dia, e.target.value)} />
        </label>
        <CampoDuracion key={estancia} dia={horario ? jornada.dia : undefined} ayuda={ayudaDuracion ? ayudaId : undefined}
          valor={jornada.minutosDisponibles} onChange={valor => cambiarDuracion(jornada.dia, valor)} />
      </div>
    </fieldset>)}
    {ayudaDuracion && <p id={ayudaId}>{ayudaDuracion}</p>}
    {children}
  </fieldset>
}
