import { useState } from 'react'
import { useConsultaApi } from '../../../hooks/useConsultaApi'
import EstadoConsulta from '../../../components/ui/EstadoConsulta'
import { contenidosApi } from '../../explorar/api'

export default function AgregarActividadApi({ disabled, agregar, usados }: { disabled: boolean; agregar: (id: number) => void; usados: number[] }) {
  const [busqueda, setBusqueda] = useState('')
  const consulta = useConsultaApi(`agregar:${busqueda}`, signal => busqueda.trim().length >= 2 ? contenidosApi.listar({ busqueda: busqueda.trim() }, signal) : Promise.resolve([]))
  return <section className="iz-plan-tarjeta formulario-api"><h2>Agregar una actividad</h2><label>Buscar contenido publicado<input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} disabled={disabled} /></label>
    <EstadoConsulta consulta={consulta} />
    {busqueda.trim().length < 2 ? <p>Escribe al menos dos letras.</p> : consulta.datos?.length === 0 && <p>No hay contenidos publicados con esa búsqueda.</p>}
    <ul className="datos-publicados">{consulta.datos?.map(r => <li key={r.idRecurso}><strong>{r.titulo}</strong><span>{r.tipo} · {r.localidad}</span><button type="button" disabled={disabled || usados.includes(r.idRecurso)} onClick={() => agregar(r.idRecurso)}>{usados.includes(r.idRecurso) ? 'Ya está en el itinerario' : `Agregar ${r.titulo}`}</button></li>)}</ul>
  </section>
}
