import { useState } from 'react'
import { Link } from 'react-router'
import { usePlanes } from '../usePlanes'
import { buscarDestino } from '../../../services/catalogo'
import CabeceraPagina from '../../../components/ui/CabeceraPagina'
import EstadoVacio from '../../../components/ui/EstadoVacio'
import Icono from '../../../components/ui/Icono'
export default function MiViajePage() {
  const { planes, borrar, error } = usePlanes(),
    [eliminar, setEliminar] = useState('')
  return (
    <section className="pagina">
      <CabeceraPagina titulo="Mi viaje" subtitulo="TUS PRÓXIMAS ESCAPADAS" />
      <p className="muted">
        Borradores de este dispositivo. No están sincronizados con tu cuenta.
      </p>
      <div className="grid-tarjetas">
        {planes.map((p) => {
          const d = buscarDestino(p.destinoId)
          return (
            <article className="tarjeta plan-guardado" key={p.id}>
              <span className="icono-caja">
                <Icono nombre="calendario" />
              </span>
              <h2>{d?.nombre ?? 'Destino no disponible'}</h2>
              <p>
                {p.fecha} · {p.inicio} · {p.actividades.length} paradas
              </p>
              <small>
                Actualizado{' '}
                {new Date(p.actualizadoEn).toLocaleDateString('es-MX')}
              </small>
              {d && (
                <Link
                  className="boton boton--secundario"
                  to={`/itinerario/${d.id}?plan=${p.id}`}
                >
                  Ver itinerario
                </Link>
              )}
              {eliminar === p.id ? (
                <div className="fila">
                  <button
                    className="enlace mensaje-error"
                    onClick={() => {
                      borrar(p.id)
                      setEliminar('')
                    }}
                  >
                    Confirmar eliminación
                  </button>
                  <button className="enlace" onClick={() => setEliminar('')}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button className="enlace" onClick={() => setEliminar(p.id)}>
                  Eliminar borrador
                </button>
              )}
            </article>
          )
        })}
      </div>
      {!planes.length && (
        <EstadoVacio titulo="Tu próxima aventura empieza aquí">
          <p>Elige un destino y guarda tu primer itinerario.</p>
          <Link className="boton boton--primario" to="/rutas">
            Explorar destinos
          </Link>
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
