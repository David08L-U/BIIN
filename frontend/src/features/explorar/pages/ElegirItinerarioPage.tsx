import { Link } from 'react-router'
import { rutasPrototipo } from '../../transporte/data/rutasPrototipo'
import '../../../styles/explorar.css'

export default function ElegirItinerarioPage() {
  return <section className="explorar iz-plan selector-itinerarios" aria-labelledby="elegir-itinerario-titulo">
    <Link className="selector-itinerarios-volver" to="/recorridos">← Volver a Mi viaje</Link>
    <header className="explorar-cabecera">
      <h1 id="elegir-itinerario-titulo">Elige tu destino</h1>
      <p>Selecciona dónde quieres planear tu visita.</p>
    </header>
    <div className="explorar-grid">
      {rutasPrototipo.map(destino => <Link
        key={destino.id}
        className="iz-plan-tarjeta itinerarios-destino"
        to={`/recorridos/crear/${destino.id}`}
      >
        <span className="itinerarios-destino-icono" aria-hidden="true"><span className="biin-icon">{destino.icono}</span></span>
        <span className="itinerarios-destino-contenido"><strong>{destino.nombre}</strong><span>{destino.descripcion}</span></span>
        <span className="biin-icon itinerarios-destino-flecha" aria-hidden="true">chevron_right</span>
      </Link>)}
    </div>
  </section>
}
