import { useState } from 'react'
import type { HorarioRuta } from '../types'
import { diasSemana, hoyYucatan } from '../../../utils/formatoDatos'

/** RF03 / CU-03: consulta por día sin descartar horarios ni vigencias publicados. */
export default function HorariosRuta({ horarios }: { horarios: HorarioRuta[] }) {
  const [dia, setDia] = useState(() => new Date(`${hoyYucatan()}T12:00:00Z`).getUTCDay())
  const salidas = horarios.filter(h => h.diaSemana === dia)
    .sort((a, b) => a.horaSalida.localeCompare(b.horaSalida))
  return <section className="destino-tarjeta datos-publicados"><h2>Horarios de salida</h2>
    <p>Hora de Yucatán</p>
    <label className="horarios-selector">Día de la semana
      <select value={dia} onChange={evento => setDia(Number(evento.target.value))}>
        {diasSemana.map((nombre, indice) => <option key={indice} value={indice}>{nombre}</option>)}
      </select>
    </label>
    {salidas.length ? <ul aria-label={`Salidas: ${diasSemana[dia]}`}>{salidas.map(h => <li key={h.idHorario}>
      <time dateTime={h.horaSalida}>{h.horaSalida.slice(0, 5)}</time>
      <small>Vigencia: desde <time dateTime={h.vigenteDesde}>{h.vigenteDesde}</time>{h.vigenteHasta ? <> hasta <time dateTime={h.vigenteHasta}>{h.vigenteHasta}</time></> : ' · sin fecha de fin'}</small>
    </li>)}</ul> : <p role="status">No hay horarios publicados para {diasSemana[dia].toLowerCase()}.</p>}
  </section>
}
