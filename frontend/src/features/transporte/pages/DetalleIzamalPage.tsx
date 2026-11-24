import { useState } from 'react'
import { Link } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { detalleIzamalPrototipo as detalle } from '../data/detalleIzamalPrototipo'
import { useFavoritoRuta } from '../hooks/useFavoritoRuta'
import '../../../styles/detalle-izamal.css'

function Icono({ nombre }: { nombre: string }) {
  return <span className="biin-icon" aria-hidden="true">{nombre}</span>
}

function ImagenPrototipo({ src, alt, icono }: {
  src: string
  alt: string
  icono: string
}) {
  const [fallo, setFallo] = useState(false)

  return fallo ? (
    <div className="izamal-imagen-alternativa" role="img" aria-label={alt}>
      <Icono nombre={icono} />
      <span>Imagen del prototipo no disponible</span>
    </div>
  ) : (
    <img className="izamal-imagen" src={src} alt={alt} onError={() => setFallo(true)} />
  )
}

/** CU-03 / RF03: composición del HTML de Melanie, con datos no confirmados. */
export default function DetalleIzamalPage({ ruta }: { ruta: RutaPrototipo }) {
  const { favorito, alternarFavorito, aviso } = useFavoritoRuta(ruta.id)
  const [estancia, setEstancia] = useState<string>(detalle.estancias[0].id)
  const [mensajeItinerario, setMensajeItinerario] = useState('')

  function avisarItinerario(tipo: 'recomendado' | 'personalizado') {
    setMensajeItinerario(
      `El itinerario ${tipo} aún no está disponible. No se ha creado ningún itinerario.`,
    )
  }

  return (
    <article className="izamal-detalle" aria-labelledby="izamal-titulo">
      <header className="izamal-barra">
        <Link to="/rutas" className="izamal-boton-icono" aria-label="Volver a lista de rutas">
          <Icono nombre="arrow_back" />
        </Link>
        <span className="izamal-estado-salida">
          <span className="izamal-punto" aria-hidden="true" />
          Salida · Sin confirmar
        </span>
        <button
          type="button"
          className="izamal-boton-icono izamal-favorito"
          aria-label="Guardar ruta favorita"
          aria-pressed={favorito}
          aria-describedby="izamal-aviso-favorito"
          onClick={alternarFavorito}
        >
          <Icono nombre={favorito ? 'favorite' : 'favorite_border'} />
        </button>
      </header>

      <div className="izamal-presentacion">
        <div className="izamal-etiquetas">
          <span className="izamal-ruta-directa">Ruta Directa Van</span>
          <span className="izamal-pueblo"><Icono nombre="star" />Pueblo Mágico</span>
        </div>
        <h1 id="izamal-titulo">Izamal</h1>
        <p>La Ciudad de las Tres Culturas · Yucatán</p>
      </div>

      <div className="izamal-metricas">
        <section className="izamal-tarjeta izamal-metrica izamal-metrica-precio" aria-labelledby="izamal-precio">
          <div className="izamal-metrica-cabecera">
            <h2 id="izamal-precio">Precio</h2>
            <span className="izamal-icono-metrica"><Icono nombre="payments" /></span>
          </div>
          <p className="izamal-valor"><strong>${ruta.precio}</strong><span>MXN</span></p>
          <p className="izamal-metrica-nota">Tarifa por pasaje · Prototipo</p>
        </section>
        <section className="izamal-tarjeta izamal-metrica" aria-labelledby="izamal-asientos">
          <div className="izamal-metrica-cabecera">
            <h2 id="izamal-asientos">Asientos</h2>
            <span className="izamal-icono-metrica"><Icono nombre="airline_seat_recline_normal" /></span>
          </div>
          <p className="izamal-valor izamal-valor-disponibilidad"><strong>Sin confirmar</strong></p>
          <p className="izamal-metrica-nota">Sin reporte vigente</p>
        </section>
      </div>

      <p className="izamal-nota-datos">
        Tarifa y recorrido del prototipo, pendientes de validar. Sin fecha de validación.
      </p>

      <section className="izamal-tarjeta izamal-terminal" aria-labelledby="izamal-terminal">
        <span className="izamal-icono-terminal"><Icono nombre="directions_bus" /></span>
        <div>
          <p className="izamal-sobretitulo">Andén de salida</p>
          <h2 id="izamal-terminal">Terminal Noreste · Calle 67</h2>
          <p>Mérida Centro Histórico</p>
        </div>
      </section>

      <section className="izamal-tarjeta izamal-recorrido" aria-labelledby="izamal-mapeo">
        <header className="izamal-recorrido-cabecera">
          <h2 id="izamal-mapeo"><Icono nombre="timeline" />Mapeo de ruta y paradas</h2>
          <span>{detalle.tiempo}<small>Prototipo</small></span>
        </header>
        <div className="izamal-foto-recorrido">
          <ImagenPrototipo src={detalle.imagenRecorrido} alt="Mapa ilustrativo del recorrido a Izamal del prototipo" icono="map" />
          <p className="izamal-pie-imagen"><Icono nombre="explore" />Trayecto Carretera Mérida-Tixkokob-Izamal</p>
        </div>
        <p className="izamal-nota-recorrido">
          El detalle original indica {detalle.tiempo}; el catálogo, {ruta.tiempo}.
          {' '}Tiempos pendientes de validar. El origen es ilustrativo; no representa tu ubicación.
        </p>
        <ol className="izamal-paradas" aria-label="Recorrido del prototipo">
          {detalle.paradas.map(parada => (
            <li key={parada.nombre} className={`izamal-parada izamal-parada-${parada.tipo}`}>
              <span className="izamal-marcador" aria-hidden="true">
                {parada.tipo === 'origen' && <Icono nombre="trip_origin" />}
                {parada.tipo === 'destino' && <Icono nombre="location_on" />}
              </span>
              <div>
                <div className="izamal-parada-titulo">
                  <strong>{parada.nombre}</strong>
                  {'etiqueta' in parada && <span>{parada.etiqueta}</span>}
                </div>
                <p>{parada.descripcion}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="izamal-nota-recorrido izamal-nota-regreso">
          Horarios y opciones de regreso: sin confirmar. Verifica con la terminal antes de viajar.
        </p>
      </section>

      <section className="izamal-tarjeta izamal-cultura" aria-labelledby="izamal-cultura">
        <div className="izamal-foto-cultural">
          <ImagenPrototipo src={detalle.imagenCultural} alt="Imagen cultural de Izamal del prototipo" icono="temple_buddhist" />
          <span className="izamal-top-destino"><Icono nombre="auto_awesome" />Top Destino</span>
          <div className="izamal-foto-textos">
            <p className="izamal-pueblo-amarillo"><Icono nombre="location_on" />Pueblo Mágico Amarillo</p>
            <h2 id="izamal-cultura">Descubre Izamal a tu ritmo</h2>
            <p>Convento Franciscano · Pirámide Kinich Kakmó · Gastronomía</p>
          </div>
        </div>
        <div className="izamal-planificador">
          <div className="izamal-itinerario-intro">
            <div className="izamal-itinerario-titulo">
              <h3><Icono nombre="edit_calendar" />Hacer mi itinerario</h3>
              <span>Personalizado</span>
            </div>
            <p>Selecciona tu tiempo disponible para planear tu visita. La creación de itinerarios aún no está disponible.</p>
          </div>
          <fieldset className="izamal-estancia">
            <legend>Tiempo de estancia:</legend>
            <div className="izamal-estancia-opciones">
              {detalle.estancias.map(opcion => (
                <label key={opcion.id}>
                  <input
                    type="radio"
                    name="estancia-izamal"
                    value={opcion.id}
                    checked={estancia === opcion.id}
                    onChange={() => setEstancia(opcion.id)}
                  />
                  <span className="izamal-estancia-opcion">
                    <strong>{opcion.nombre}</strong>
                    <small>{opcion.duracion}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="izamal-lugares">
            <p className="izamal-sobretitulo">Paradas imperdibles del prototipo:</p>
            <ul>
              {detalle.lugares.map(lugar => (
                <li key={lugar.nombre}><Icono nombre={lugar.icono} />{lugar.nombre}</li>
              ))}
            </ul>
          </div>
          <div className="izamal-acciones-itinerario">
            <button type="button" className="izamal-accion-principal" onClick={() => avisarItinerario('recomendado')} aria-describedby="izamal-estado-itinerario">
              <Icono nombre="explore" />
              <span>Itinerario recomendado en Izamal</span>
              <Icono nombre="arrow_forward" />
            </button>
            <button type="button" className="izamal-accion-secundaria" onClick={() => avisarItinerario('personalizado')} aria-describedby="izamal-estado-itinerario">
              <Icono nombre="tune" /><span>Personalizar mi itinerario</span>
            </button>
          </div>
          <p id="izamal-estado-itinerario" className="izamal-mensaje" role="status" aria-atomic="true">{mensajeItinerario}</p>
        </div>
      </section>
      <p id="izamal-aviso-favorito" className="izamal-nota-favorito" role="status" aria-atomic="true">{aviso}</p>
    </article>
  )
}
