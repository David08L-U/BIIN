import ConfiguracionVisita from './ConfiguracionVisita'
import { cambiarEstanciaValladolid } from '../plan/borradorValladolid'
import { esEstanciaValladolid, estanciasValladolid, ventanasValladolid } from '../plan/itinerarioValladolid'
import type { BorradorValladolid } from '../plan/itinerarioValladolid'

export default function ConfiguracionValladolid({ borrador, onChange }: { borrador: BorradorValladolid; onChange: (borrador: BorradorValladolid) => void }) {
  const config = borrador.configuracion
  const cambiar = (campo: keyof typeof config, valor: string) => onChange({ ...borrador, generado: false, configuracion: { ...config, [campo]: valor } })
  return <ConfiguracionVisita
    estancia={config.estancia}
    opciones={estanciasValladolid}
    fecha={config.fecha}
    jornadas={ventanasValladolid(config)}
    horario={{ min: '06:00', max: '22:00' }}
    cambiarEstancia={valor => { if (esEstanciaValladolid(valor)) onChange(cambiarEstanciaValladolid(borrador, valor)) }}
    cambiarFecha={valor => cambiar('fecha', valor)}
    cambiarHora={(dia, valor) => cambiar(dia === 1 ? 'horaInicio' : 'horaInicioDia2', valor)}
    cambiarDuracion={(dia, valor) => cambiar(dia === 1 ? 'minutosDisponibles' : 'minutosDia2', valor)}
  >
    <p>Inicio y regreso son objetivos tuyos; transporte sin confirmar. Ventanas de 06:00 a 22:00 como límite del planificador, sin acreditar aperturas. Cada jornada incluye traslado final y 15 min de margen.</p>
    {config.estancia === 'fin-de-semana' && <p>Dos jornadas independientes, sin actividades nocturnas, alojamiento ni transporte entre días. Al pasar a una sola jornada, todas las visitas elegidas se asignan al Día 1 y debes generar de nuevo.</p>}
  </ConfiguracionVisita>
}
