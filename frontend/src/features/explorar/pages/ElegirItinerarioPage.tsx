import { Link } from 'react-router'
import { urlPlanificador } from '../../mi-viaje/plan/urlsPlanificador'
import { destinosExplorar } from '../data/lugaresExplorar'
import '../../../styles/explorar.css'

export default function ElegirItinerarioPage() {
  return <section className="explorar iz-plan" aria-labelledby="elegir-itinerario-titulo">
    <header className="explorar-cabecera"><h1 id="elegir-itinerario-titulo">Elige tu destino</h1><p>Abre el planificador recomendado o configura una visita.</p></header>
    <div className="explorar-grid">{destinosExplorar.map(destino => <article key={destino.id} className="iz-plan-tarjeta explorar-card">
      <h2>{destino.nombre}</h2>
      <div className="explorar-acciones">
        <Link className="iz-plan-primario" to={urlPlanificador(destino.id, 'recomendado')}>Itinerario recomendado</Link>
        <Link to={urlPlanificador(destino.id, 'personalizado')}>Personalizar itinerario</Link>
      </div>
    </article>)}</div>
  </section>
}
