import { Link, useParams } from 'react-router'
import PaginaEnConstruccion from '../../../components/layout/PaginaEnConstruccion'
import { rutasPrototipo } from '../data/rutasPrototipo'
import DetalleIzamalPage from './DetalleIzamalPage'

/** CU-03 / RF03: solo Izamal tiene por ahora su diseño implementado. */
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

  if (ruta.id !== 'izamal') {
    return <PaginaEnConstruccion titulo="Detalle de ruta" casos="CU-03" />
  }

  return <DetalleIzamalPage ruta={ruta} />
}
