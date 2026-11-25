import ConfiguracionVisita from './ConfiguracionVisita'
import type { ConfiguracionViaje as Configuracion } from '../plan/itinerarioIzamal'
import { estanciasIzamal } from '../plan/itinerarioIzamal'
import { cambiarEstanciaIzamal } from '../plan/borradorIzamal'

export default function ConfiguracionViaje({ configuracion, onChange }: { configuracion: Configuracion; onChange: (config: Configuracion) => void }) {
  return <ConfiguracionVisita
    estancia={configuracion.estancia}
    opciones={estanciasIzamal}
    fecha={configuracion.fecha}
    jornadas={[{ ...configuracion, dia: 1 }]}
    cambiarEstancia={valor => onChange(cambiarEstanciaIzamal(configuracion, valor))}
    cambiarFecha={fecha => onChange({ ...configuracion, fecha })}
    cambiarHora={(_, valor) => onChange({ ...configuracion, horaInicio: valor })}
    cambiarDuracion={(_, valor) => onChange({ ...configuracion, minutosDisponibles: valor })}
  >
    <p>La hora es tu elección; no es una llegada confirmada de transporte.{configuracion.estancia === 'tarde-magica' && ' Tarde mágica inicia con 3 horas; no calcula un atardecer real.'}</p>
  </ConfiguracionVisita>
}
