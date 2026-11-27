import type { HorarioRuta } from '../types'
import { hoyYucatan } from '../../../utils/formatoDatos'

export const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export default function HorariosRuta({ horarios }: { horarios: HorarioRuta[] }) {
  const hoy = hoyYucatan()
  const vigentes = horarios.filter(h => h.vigenteDesde <= hoy && (!h.vigenteHasta || h.vigenteHasta >= hoy))
    .sort((a, b) => a.diaSemana - b.diaSemana || a.horaSalida.localeCompare(b.horaSalida))
  return <section className="destino-tarjeta datos-publicados"><h2>Horarios de salida</h2>
    {vigentes.length ? <ul>{vigentes.map(h => <li key={h.idHorario}>{diasSemana[h.diaSemana]} · {h.horaSalida.slice(0, 5)} <small>Hora de Yucatán</small></li>)}</ul> : <p>Sin horarios vigentes publicados.</p>}
  </section>
}
