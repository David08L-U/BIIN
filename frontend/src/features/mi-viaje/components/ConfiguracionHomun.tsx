import ConfiguracionVisita from './ConfiguracionVisita'
import { cambiarEstanciaHomun } from '../plan/borradorHomun'
import { esEstanciaHomun, estanciasHomun, ventanasHomun } from '../plan/itinerarioHomun'
import type { BorradorHomun } from '../plan/itinerarioHomun'

export default function ConfiguracionHomun({ borrador, onChange }: { borrador: BorradorHomun; onChange: (b: BorradorHomun) => void }) {
  const c = borrador.configuracion
  const cambiar = (campo: keyof typeof c, valor: string) => onChange({ ...borrador, generado: false, configuracion: { ...c, [campo]: valor } })
  return <ConfiguracionVisita
    estancia={c.estancia}
    opciones={estanciasHomun}
    fecha={c.fecha}
    jornadas={ventanasHomun(c)}
    horario={{ min: '06:00', max: '22:00' }}
    cambiarEstancia={valor => { if (esEstanciaHomun(valor)) onChange(cambiarEstanciaHomun(borrador, valor)) }}
    cambiarFecha={valor => cambiar('fecha', valor)}
    cambiarHora={(dia, valor) => cambiar(dia === 1 ? 'horaInicio' : 'horaInicioDia2', valor)}
    cambiarDuracion={(dia, valor) => cambiar(dia === 1 ? 'minutosDisponibles' : 'minutosDia2', valor)}
  >
    <p>Ventanas entre 06:00 y 22:00 como límite del planificador, sin acreditar aperturas. {c.estancia === 'fin-de-semana' ? 'El regreso final estimado se incluye solo el Día 2.' : 'Incluye un regreso final estimado.'} Se reservan 15 min de margen.</p>
    {c.estancia === 'fin-de-semana' && <p>Dos jornadas independientes, sin actividades nocturnas ni transporte o alojamiento entre días. Al pasar a una jornada, las visitas se asignan al Día 1 y debes generar de nuevo.</p>}
  </ConfiguracionVisita>
}
