import { Link, useParams } from 'react-router'
import { rutasPrototipo } from '../../transporte/data/rutasPrototipo'
import { urlPlanificador } from '../../mi-viaje/plan/urlsPlanificador'
import type { DestinoPlanificador } from '../../mi-viaje/plan/urlsPlanificador'
import '../../../styles/explorar.css'

export default function ElegirModoItinerarioPage() {
  const { destino: id } = useParams()
  const destino = rutasPrototipo.find(ruta => ruta.id === id)

  if (!destino) return <section className="explorar iz-plan selector-itinerarios" aria-labelledby="destino-invalido-titulo">
    <h1 id="destino-invalido-titulo">No encontramos ese destino</h1>
    <Link className="iz-plan-primario" to="/recorridos/crear">Elegir destino</Link>
  </section>

  const destinoPlanificador = destino.id as DestinoPlanificador
  const volver = `/recorridos/crear/${destino.id}`

  return <section className="explorar iz-plan selector-itinerarios" aria-labelledby="elegir-modo-titulo">
    <Link className="selector-itinerarios-volver" to="/recorridos/crear">← Volver a destinos</Link>
    <header className="explorar-cabecera">
      <p className="explorar-meta">{destino.nombre}</p>
      <h1 id="elegir-modo-titulo">¿Cómo quieres planear tu visita?</h1>
    </header>
    <div className="explorar-grid itinerarios-modos">
      <article className="iz-plan-tarjeta explorar-card">
        <span className="itinerarios-modo-icono biin-icon" aria-hidden="true">auto_awesome</span>
        <h2>Recomendado</h2>
        <p>Deja que el planificador organice una propuesta para tu visita.</p>
        <Link className="iz-plan-primario" state={{ volverPlan: volver }} to={urlPlanificador(destinoPlanificador, 'recomendado')}>Usar recomendado</Link>
      </article>
      <article className="iz-plan-tarjeta explorar-card">
        <span className="itinerarios-modo-icono biin-icon" aria-hidden="true">tune</span>
        <h2>Personalizado</h2>
        <p>Elige los lugares que quieres incluir en tu recorrido.</p>
        <Link state={{ volverPlan: volver }} to={urlPlanificador(destinoPlanificador, 'personalizado')}>Personalizar itinerario</Link>
      </article>
    </div>
  </section>
}
