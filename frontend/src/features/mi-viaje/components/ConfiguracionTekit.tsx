import ConfiguracionVisita from './ConfiguracionVisita'
import { cambiarModalidadTekit } from '../plan/borradorTekit'
import { modalidadesTekit } from '../plan/itinerarioTekit'
import type { BorradorTekit } from '../plan/itinerarioTekit'

export default function ConfiguracionTekit({ borrador, onChange }: { borrador: BorradorTekit; onChange: (b: BorradorTekit) => void }) {
  const c = borrador.configuracion
  const cambiar = (campo: 'fecha' | 'horaInicio' | 'minutosDisponibles', valor: string) => onChange({ ...borrador, generado: false, configuracion: { ...c, [campo]: valor } })
  return <ConfiguracionVisita
    estancia={c.estancia}
    opciones={modalidadesTekit}
    etiqueta="Estancia o modalidad"
    fecha={c.fecha}
    jornadas={[{ ...c, dia: 1 }]}
    cambiarEstancia={valor => onChange(cambiarModalidadTekit(borrador, valor))}
    cambiarFecha={valor => cambiar('fecha', valor)}
    cambiarHora={(_, valor) => cambiar('horaInicio', valor)}
    cambiarDuracion={(_, valor) => cambiar('minutosDisponibles', valor)}
    ayudaDuracion={c.estancia === 'ruta-textil' ? 'Ruta Textil · Compras no tiene duración fija. Indica cuánto tiempo tienes.' : 'Tiempo editable; incluye visitas, traslados, regreso y 15 min de margen.'}
  >
    <p>Fecha y hora en la zona local de este navegador. El inicio y el regreso son tus objetivos; confirma el transporte por separado.</p>
  </ConfiguracionVisita>
}
