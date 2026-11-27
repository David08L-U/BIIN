import { Link, useLocation } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import MiViajePage from './MiViajePage'
import '../../../styles/itinerario-izamal.css'

const rutaBorrador = /^\/rutas\/(?:izamal|valladolid|tekit|homun|ticul)\/(?:itinerario|personalizar)(?:\?.*)?$/

function borradorRecuperable(state: unknown): string | undefined {
  if (!state || typeof state !== 'object' || !('borradorFuente' in state)) return undefined
  const ruta = (state as { borradorFuente?: unknown }).borradorFuente
  return typeof ruta === 'string' && rutaBorrador.test(ruta) ? ruta : undefined
}

export default function EntradaItinerariosPage() {
  const { usuario, cargando, errorRestauracion, reintentarRestauracion } = useAuth()
  const location = useLocation()
  const borradorFuente = borradorRecuperable(location.state)

  if (usuario) return <MiViajePage borradorFuente={borradorFuente} />

  return <section className="iz-plan iz-plan-mis-viajes" aria-labelledby="entrada-itinerarios-titulo">
    <h1 id="entrada-itinerarios-titulo">Mi viaje</h1>
    <section className="iz-plan-mis-viajes-seccion" aria-labelledby="entrada-guardados-titulo">
      <h2 id="entrada-guardados-titulo">Mis itinerarios guardados</h2>
      {cargando && <p role="status">Comprobando tu sesión…</p>}
      {errorRestauracion && <div role="alert" className="iz-plan-error">
        <p>No se pudo comprobar tu sesión. Puedes reintentar o seguir creando un itinerario.</p>
        <button type="button" onClick={() => void reintentarRestauracion()}>Reintentar</button>
      </div>}
      {!cargando && !errorRestauracion && <article className="iz-plan-tarjeta entrada-itinerarios-acceso">
        <p>Inicia sesión para consultar los itinerarios de tu cuenta.</p>
        <Link to="/login" state={{ desde: `${location.pathname}${location.search}${location.hash}` }}>Iniciar sesión</Link>
      </article>}
    </section>
    <section className="iz-plan-mis-viajes-seccion" aria-labelledby="entrada-crear-titulo">
      <h2 id="entrada-crear-titulo">Crear un itinerario</h2>
      <p>Puedes comenzar ahora. Te pediremos iniciar sesión al guardar.</p>
      <Link className="iz-plan-primario" to="/recorridos/crear">Crear itinerario</Link>
    </section>
  </section>
}
