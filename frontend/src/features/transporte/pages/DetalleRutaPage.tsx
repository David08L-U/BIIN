import { Link, useParams } from 'react-router'
import { rutasPrototipo } from '../data/rutasPrototipo'
import DetalleIzamalPage from './DetalleIzamalPage'
import DetalleValladolidPage from './DetalleValladolidPage'
import DetalleTekitPage from './DetalleTekitPage'
import DetalleHomunPage from './DetalleHomunPage'
import DetalleTiculPage from './DetalleTiculPage'

/** CU-03 / RF03: los cinco destinos del catálogo tienen su propio detalle. */
export default function DetalleRutaPage() {
  const { id } = useParams()
  const ruta = rutasPrototipo.find(opcion => opcion.id === id)

  if (ruta) {
    if (ruta.id === 'izamal') return <DetalleIzamalPage ruta={ruta} />
    if (ruta.id === 'valladolid') return <DetalleValladolidPage ruta={ruta} />
    if (ruta.id === 'tekit') return <DetalleTekitPage ruta={ruta} />
    if (ruta.id === 'homun') return <DetalleHomunPage ruta={ruta} />
    if (ruta.id === 'ticul') return <DetalleTiculPage ruta={ruta} />
  }

  return (
    <section className="pagina" aria-labelledby="ruta-no-encontrada">
      <h1 id="ruta-no-encontrada">Ruta no encontrada</h1>
      <p>No encontramos ese destino en el catálogo de BIIN.</p>
      <Link to="/rutas">Volver al catálogo de rutas</Link>
    </section>
  )
}
