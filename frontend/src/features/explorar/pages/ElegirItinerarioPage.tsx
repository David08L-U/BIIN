import { Link, useSearchParams } from 'react-router'
import { useConsultaApi } from '../../../hooks/useConsultaApi'
import EstadoConsulta from '../../../components/ui/EstadoConsulta'
import FotografiaPublicada from '../../../components/ui/FotografiaPublicada'
import { idPositivo } from '../../../utils/consultaApi'
import { fechaHora } from '../../../utils/formatoDatos'
import { recorridosApi } from '../../recorridos/api'
import { duracionPlan } from '../../mi-viaje/plan/duracion'
import '../../../styles/explorar.css'
import '../../../styles/planificador.css'

export default function ElegirItinerarioPage() {
  const [params] = useSearchParams()
  const localidad = idPositivo(params.get('localidad')) ?? undefined
  const consulta = useConsultaApi(`elegir-recorrido:${localidad}`, signal => recorridosApi.listar({ idLocalidadBase: localidad }, signal))
  return <section className="explorar plan"><header className="explorar-cabecera"><h1>Elige tu recorrido</h1><p>Planea una visita con las actividades publicadas en BIIN.</p></header><EstadoConsulta consulta={consulta} />
    {consulta.datos?.length === 0 && <p role="status">Todavía no hay recorridos publicados.</p>}
    <div className="explorar-grid">{consulta.datos?.map(r => <article key={r.idRecorrido} className="plan-tarjeta explorar-card"><FotografiaPublicada src={r.fotoPrincipal} alt={r.titulo} /><p>{r.localidadBase} · {r.municipio}</p><h2>{r.titulo}</h2><p>{r.descripcion}</p><p>{r.totalEtapas} etapas · {duracionPlan(r.duracionTotalMin)} estimados</p><p className="plan-nota">Actualizado: {fechaHora(r.actualizadoEn)}</p><div className="explorar-acciones"><Link className="plan-primario" to={`/recorridos/${r.idRecorrido}/itinerario`}>Itinerario recomendado</Link><Link to={`/recorridos/${r.idRecorrido}/personalizar`}>Personalizar itinerario</Link></div></article>)}</div>
  </section>
}
