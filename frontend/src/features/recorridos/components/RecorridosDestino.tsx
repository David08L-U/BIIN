import { Link } from 'react-router'
import { useConsultaApi } from '../../../hooks/useConsultaApi'
import EstadoConsulta from '../../../components/ui/EstadoConsulta'
import { recorridosApi } from '../api'
import { duracionPlan } from '../../mi-viaje/plan/duracion'

export default function RecorridosDestino({ idLocalidad, idRuta }: { idLocalidad?: number; idRuta: number }) {
  const consulta = useConsultaApi(`recorridos-localidad:${idLocalidad}`, signal => idLocalidad ? recorridosApi.listar({ idLocalidadBase: idLocalidad }, signal) : Promise.resolve([]))
  return <div className="datos-publicados"><EstadoConsulta consulta={consulta} />
    {consulta.datos?.length === 0 && <p role="status">Todavía no hay recorridos sugeridos publicados para este destino.</p>}
    {consulta.datos?.map(r => <section className="recorrido-opcion" key={r.idRecorrido}><h3>{r.titulo}</h3><p>{r.descripcion}</p><p>{r.totalEtapas} etapas · {duracionPlan(r.duracionTotalMin)} estimados</p><div className="destino-acciones-itinerario"><Link className="destino-accion-principal" to={`/rutas/${idRuta}/itinerario?recorrido=${r.idRecorrido}`}>Ver itinerario recomendado</Link><Link className="destino-accion-secundaria" to={`/rutas/${idRuta}/personalizar?recorrido=${r.idRecorrido}`}>Personalizar mi itinerario</Link></div></section>)}
  </div>
}
