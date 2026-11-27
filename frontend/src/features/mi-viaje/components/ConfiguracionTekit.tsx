import ConfiguracionVisita from './ConfiguracionVisita'
import { cambiarModalidadTekit } from '../plan/borradorTekit'
import type { BorradorTekit } from '../plan/itinerarioTekit'
import { estanciasCompartidas } from '../plan/estanciasCompartidas'
import { siguienteFechaLocal } from '../plan/tiempoLocal'

export default function ConfiguracionTekit({ borrador, onChange }: { borrador: BorradorTekit; onChange: (b: BorradorTekit) => void }) {
  const c = borrador.configuracion
  const opciones = c.estancia === 'ruta-textil' ? { ...estanciasCompartidas, 'ruta-textil': { nombre: 'Modalidad anterior · Ruta Textil' } } : estanciasCompartidas
  const jornadas = [{ dia: 1, fecha: c.fecha, horaInicio: c.horaInicio, minutosDisponibles: c.minutosDisponibles },
    ...(c.estancia === 'fin-de-semana' ? [{ dia: 2, fecha: siguienteFechaLocal(c.fecha), horaInicio: c.horaInicioDia2 ?? '', minutosDisponibles: c.minutosDia2 ?? '' }] : [])]
  const cambiar = (campo: 'fecha' | 'horaInicio' | 'minutosDisponibles', valor: string) => onChange({ ...borrador, generado: false, configuracion: { ...c, [campo]: valor } })
  return <ConfiguracionVisita
    estancia={c.estancia}
    opciones={opciones}
    etiqueta="Estancia o modalidad"
    fecha={c.fecha}
    jornadas={jornadas}
    horario={c.estancia === 'fin-de-semana' ? { min: '06:00', max: '22:00' } : undefined}
    cambiarEstancia={valor => onChange(cambiarModalidadTekit(borrador, valor))}
    cambiarFecha={valor => cambiar('fecha', valor)}
    cambiarHora={(dia, valor) => onChange({ ...borrador, generado: false, configuracion: { ...c, [dia === 1 ? 'horaInicio' : 'horaInicioDia2']: valor } })}
    cambiarDuracion={(dia, valor) => onChange({ ...borrador, generado: false, configuracion: { ...c, [dia === 1 ? 'minutosDisponibles' : 'minutosDia2']: valor } })}
    ayudaDuracion={c.estancia === 'fin-de-semana' ? 'Presupuesto editable por jornada; incluye visitas, traslados locales y margen. El regreso final se cuenta solo en el Día 2.' : 'Tiempo editable; incluye visitas, traslados locales, un regreso final y margen.'}
  >
    <label>Preferencia temática<select value={c.preferencia ?? ''} onChange={e => onChange({ ...borrador, generado: false, configuracion: { ...c, preferencia: e.target.value } })}>
      <option value="">Sin preferencia</option><option value="ruta-textil">Ruta Textil · Compras</option>
    </select></label>
    {c.estancia === 'ruta-textil' && <p>Conservamos la modalidad anterior y sus tiempos. Elige una estancia para usar los nuevos presupuestos.</p>}
    <p>Fecha y hora en la zona local de este navegador. El inicio y el regreso son tus objetivos; confirma el transporte por separado.</p>
  </ConfiguracionVisita>
}
