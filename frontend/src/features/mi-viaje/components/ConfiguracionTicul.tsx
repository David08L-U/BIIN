import ConfiguracionVisita from './ConfiguracionVisita'
import { cambiarModalidadTicul } from '../plan/borradorTicul'
import type { BorradorTicul } from '../plan/itinerarioTicul'
import { estanciasCompartidas } from '../plan/estanciasCompartidas'
import { siguienteFechaLocal } from '../plan/tiempoLocal'

export default function ConfiguracionTicul({ borrador, onChange }: { borrador: BorradorTicul; onChange: (b: BorradorTicul) => void }) {
  const c = borrador.configuracion
  const opciones = c.estancia === 'tour-compras' ? { ...estanciasCompartidas, 'tour-compras': { nombre: 'Modalidad anterior · Tour de Compras' } } : estanciasCompartidas
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
    cambiarEstancia={valor => onChange(cambiarModalidadTicul(borrador, valor))}
    cambiarFecha={valor => cambiar('fecha', valor)}
    cambiarHora={(dia, valor) => onChange({ ...borrador, generado: false, configuracion: { ...c, [dia === 1 ? 'horaInicio' : 'horaInicioDia2']: valor } })}
    cambiarDuracion={(dia, valor) => onChange({ ...borrador, generado: false, configuracion: { ...c, [dia === 1 ? 'minutosDisponibles' : 'minutosDia2']: valor } })}
    ayudaDuracion={c.estancia === 'fin-de-semana' ? 'Presupuesto editable por jornada; incluye visitas, traslados locales y margen. El regreso final se cuenta solo en el Día 2.' : 'Tiempo editable; incluye visitas, traslados locales, un regreso final y margen.'}
  >
    <label>Preferencia temática<select value={c.preferencia ?? ''} onChange={e => onChange({ ...borrador, generado: false, configuracion: { ...c, preferencia: e.target.value } })}>
      <option value="">Sin preferencia</option><option value="tour-compras">Tour de Compras</option><option value="ruta-puuc">Ruta Puuc</option>
    </select></label>
    {c.preferencia === 'ruta-puuc' && <p>Esta propuesta incluye solo referencias de Ticul, sin excursiones a otras localidades.</p>}
    {c.preferencia === 'tour-compras' && <p>El recomendado prioriza alfarería y calzado. Puedes elegir otras categorías al personalizar.</p>}
    {(c.estancia === 'tour-compras' || (c.estancia === 'dia-completo' && !c.minutosDisponibles)) && <p>Conservamos la modalidad anterior y sus tiempos. Elige una estancia para usar los nuevos presupuestos.</p>}
    <p>Fecha y hora en la zona local de este navegador. Inicio y regreso son tus objetivos; confirma el transporte por separado.</p>
  </ConfiguracionVisita>
}
