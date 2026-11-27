import ConfiguracionVisita from './ConfiguracionVisita'
import type { ConfiguracionViaje as Configuracion } from '../plan/itinerarioIzamal'
import { estanciasIzamal } from '../plan/itinerarioIzamal'
import { cambiarEstanciaIzamal } from '../plan/borradorIzamal'
import { estanciasCompartidas } from '../plan/estanciasCompartidas'
import { siguienteFechaLocal } from '../plan/tiempoLocal'

export default function ConfiguracionViaje({ configuracion, onChange }: { configuracion: Configuracion; onChange: (config: Configuracion) => void }) {
  const opciones = configuracion.estancia === 'tarde-magica' ? estanciasIzamal : estanciasCompartidas
  const jornadas = [{ dia: 1, fecha: configuracion.fecha, horaInicio: configuracion.horaInicio, minutosDisponibles: configuracion.minutosDisponibles },
    ...(configuracion.estancia === 'fin-de-semana' ? [{ dia: 2, fecha: siguienteFechaLocal(configuracion.fecha), horaInicio: configuracion.horaInicioDia2 ?? '', minutosDisponibles: configuracion.minutosDia2 ?? '' }] : [])]
  return <ConfiguracionVisita
    estancia={configuracion.estancia}
    opciones={opciones}
    fecha={configuracion.fecha}
    jornadas={jornadas}
    horario={configuracion.estancia === 'fin-de-semana' ? { min: '06:00', max: '22:00' } : undefined}
    cambiarEstancia={valor => { const nueva = cambiarEstanciaIzamal(configuracion, valor); onChange(nueva) }}
    cambiarFecha={fecha => onChange({ ...configuracion, fecha })}
    cambiarHora={(dia, valor) => onChange(dia === 1 ? { ...configuracion, horaInicio: valor } : { ...configuracion, horaInicioDia2: valor })}
    cambiarDuracion={(dia, valor) => onChange(dia === 1 ? { ...configuracion, minutosDisponibles: valor } : { ...configuracion, minutosDia2: valor })}
    ayudaDuracion="El tiempo es tu presupuesto de visita; no representa horarios de transporte ni de apertura."
  >
    <p>La hora es tu elección; no es una llegada confirmada de transporte.{configuracion.estancia === 'tarde-magica' && ' Tarde mágica inicia con 3 horas; no calcula un atardecer real.'}</p>
  </ConfiguracionVisita>
}
