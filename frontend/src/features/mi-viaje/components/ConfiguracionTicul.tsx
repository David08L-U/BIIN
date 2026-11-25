import ConfiguracionVisita from './ConfiguracionVisita'
import { cambiarModalidadTicul } from '../plan/borradorTicul'
import { modalidadesTicul } from '../plan/itinerarioTicul'
import type { BorradorTicul } from '../plan/itinerarioTicul'

export default function ConfiguracionTicul({ borrador, onChange }: { borrador: BorradorTicul; onChange: (b: BorradorTicul) => void }) {
  const c = borrador.configuracion
  const cambiar = (campo: 'fecha' | 'horaInicio' | 'minutosDisponibles', valor: string) => onChange({ ...borrador, generado: false, configuracion: { ...c, [campo]: valor } })
  return <ConfiguracionVisita
    estancia={c.estancia}
    opciones={modalidadesTicul}
    etiqueta="Estancia o modalidad"
    fecha={c.fecha}
    jornadas={[{ ...c, dia: 1 }]}
    cambiarEstancia={valor => onChange(cambiarModalidadTicul(borrador, valor))}
    cambiarFecha={valor => cambiar('fecha', valor)}
    cambiarHora={(_, valor) => cambiar('horaInicio', valor)}
    cambiarDuracion={(_, valor) => cambiar('minutosDisponibles', valor)}
    ayudaDuracion={c.estancia === 'medio-dia' ? 'Tiempo editable; incluye visitas, traslados, regreso y 15 min de margen.' : 'Esta modalidad no tiene duración fija. Indica cuánto tiempo tienes.'}
  >
    {c.estancia === 'dia-completo' && <p>Ruta Puuc: esta propuesta incluye solo las referencias de Ticul, sin excursiones a otras localidades.</p>}
    {c.estancia === 'tour-compras' && <p>El recomendado prioriza alfarería y calzado. Puedes elegir otras categorías al personalizar.</p>}
    <p>Fecha y hora en la zona local de este navegador. Inicio y regreso son tus objetivos; confirma el transporte por separado.</p>
  </ConfiguracionVisita>
}
