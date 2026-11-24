import { Link, useParams } from 'react-router'
import PaginaEnConstruccion from '../../../components/layout/PaginaEnConstruccion'
import { rutasPrototipo } from '../data/rutasPrototipo'
import DetalleIzamalPage from './DetalleIzamalPage'
import DetalleValladolidPage from './DetalleValladolidPage'
import DetalleTekitPage from './DetalleTekitPage'

/** CU-03 / RF03: detalles implementados de Izamal, Valladolid y Tekit. */
export default function DetalleRutaPage() {
  const { id } = useParams()
  const ruta = rutasPrototipo.find(opcion => opcion.id === id)

  if (!ruta) {
    return (
      <section className="pagina" aria-labelledby="ruta-no-encontrada">
        <h1 id="ruta-no-encontrada">Ruta no encontrada</h1>
        <p>No encontramos ese destino en el catálogo de BIIN.</p>
        <Link to="/rutas">Volver al catálogo de rutas</Link>
      </section>
    )
  }

  if (ruta.id === 'izamal') return <DetalleIzamalPage ruta={ruta} />
  if (ruta.id === 'valladolid') return <DetalleValladolidPage ruta={ruta} />
  if (ruta.id === 'tekit') return <DetalleTekitPage ruta={ruta} />

  return <PaginaEnConstruccion titulo="Detalle de ruta" casos="CU-03" />
}
