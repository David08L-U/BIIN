import { Link } from 'react-router'
import { useFavoritos } from '../useFavoritos'
import { destinos } from '../../../services/catalogo'
import TarjetaDestino from '../../transporte/components/TarjetaDestino'
import CabeceraPagina from '../../../components/ui/CabeceraPagina'
import EstadoVacio from '../../../components/ui/EstadoVacio'
export default function FavoritosPage() {
  const { favoritos, alternar, error } = useFavoritos(),
    lista = destinos.filter((d) => favoritos.includes(d.id))
  return (
    <section className="pagina">
      <CabeceraPagina titulo="Mis favoritos" subtitulo="DESTINOS PARA VOLVER" />
      <p className="muted">Guardados en este dispositivo.</p>
      <div className="lista-destinos">
        {lista.map((d) => (
          <div key={d.id}>
            <TarjetaDestino destino={d} />
            <button
              className="enlace quitar-favorito"
              onClick={() => alternar(d.id)}
            >
              Quitar {d.nombre} de favoritos
            </button>
          </div>
        ))}
      </div>
      {!lista.length && (
        <EstadoVacio titulo="Aún no hay destinos favoritos">
          <p>Guarda los que te gustaría conocer.</p>
          <Link to="/rutas">Descubrir rutas</Link>
        </EstadoVacio>
      )}
      {error && (
        <p role="alert" className="mensaje-error">
          {error}
        </p>
      )}
    </section>
  )
}
