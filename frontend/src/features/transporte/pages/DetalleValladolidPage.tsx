import { useState } from 'react'
import { Link } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { detalleValladolidPrototipo as detalle } from '../data/detalleValladolidPrototipo'
import type { EstanciaValladolid } from '../data/detalleValladolidPrototipo'
import { useFavoritoRuta } from '../hooks/useFavoritoRuta'
import '../../../styles/detalle-valladolid.css'

function Icono({ nombre, tamano }: { nombre: string; tamano: number }) {
  return <span className="biin-icon" aria-hidden="true" style={{ fontSize: tamano }}>{nombre}</span>
}

function ImagenValladolid({ src, alt }: { src: string; alt: string }) {
  const [fallo, setFallo] = useState(false)
  return fallo ? (
    <div className="valladolid-imagen-alternativa" role="img" aria-label={alt}>
      <Icono nombre="image" tamano={24} />
      <span>Imagen del prototipo no disponible</span>
    </div>
  ) : <img className="valladolid-imagen" src={src} alt={alt} onError={() => setFallo(true)} />
}

/** CU-03 / RF03: composición propia de Valladolid, sin datos operativos confirmados. */
export default function DetalleValladolidPage({ ruta }: { ruta: RutaPrototipo }) {
  const { favorito, alternarFavorito, aviso } = useFavoritoRuta(ruta.id)
  const [estancia, setEstancia] = useState<EstanciaValladolid>('medio-dia')
  const [mensaje, setMensaje] = useState('')

  return (
    <article className="valladolid-detalle" aria-labelledby="valladolid-titulo">
      <header className="valladolid-barra">
        <Link to="/rutas" className="valladolid-boton-icono" aria-label="Volver al catálogo de rutas">
          <Icono nombre="arrow_back" tamano={20} />
        </Link>
        <span className="valladolid-estado-salida"><span aria-hidden="true" />Salida · Sin confirmar</span>
        <button
          type="button"
          className="valladolid-boton-icono valladolid-favorito"
          aria-label="Guardar Valladolid como favorito"
          aria-pressed={favorito}
          aria-describedby="valladolid-aviso-favorito"
          onClick={alternarFavorito}
        >
          <Icono nombre="favorite" tamano={20} />
        </button>
      </header>

      <div className="valladolid-presentacion">
        <span className="valladolid-etiqueta-ruta">{detalle.etiqueta}</span>
        <h1 id="valladolid-titulo">Valladolid</h1>
        <p>{detalle.descripcion}</p>
      </div>

      <div className="valladolid-metricas">
        <section className="valladolid-tarjeta valladolid-metrica" aria-label="Tarifa">
          <div className="valladolid-metrica-cabecera"><Icono nombre="confirmation_number" tamano={22} /><span>Por boleto</span></div>
          <div><p className="valladolid-valor">${ruta.precio} MXN</p><p className="valladolid-texto-pequeno">Tarifa pasaje directo</p></div>
        </section>
        <section className="valladolid-tarjeta valladolid-metrica" aria-label="Disponibilidad">
          <div className="valladolid-metrica-cabecera"><Icono nombre="airline_seat_recline_normal" tamano={22} /><span className="valladolid-punto-disponibilidad" aria-hidden="true" /></div>
          <div><p className="valladolid-valor">Sin confirmar</p><p className="valladolid-texto-pequeno">Sin reporte vigente</p></div>
        </section>
      </div>

      <p className="valladolid-nota-datos">
        Datos del prototipo, pendientes de validar y sin fecha de validación: tarifa, duración, recorrido y referencias. Horarios, andén y distancia sin confirmar.
      </p>

      <section className="valladolid-tarjeta valladolid-terminal" aria-labelledby="valladolid-terminal-titulo">
        <span className="valladolid-terminal-icono"><Icono nombre="directions_bus" tamano={22} /></span>
        <div>
          <div className="valladolid-terminal-etiquetas"><span>Andén de salida</span><span>Sin confirmar</span></div>
          <h2 id="valladolid-terminal-titulo">{detalle.terminal}</h2>
          <p>{detalle.referenciaTerminal}</p>
        </div>
      </section>

      <section className="valladolid-recorrido" aria-labelledby="valladolid-recorrido-titulo">
        <div className="valladolid-recorrido-cabecera"><h2 id="valladolid-recorrido-titulo">Mapeo de ruta y paradas</h2><span>~{ruta.tiempo}</span></div>
        <div className="valladolid-mapa">
          <ImagenValladolid src={detalle.imagenRecorrido} alt="Mapa ilustrativo de Mérida a Valladolid del prototipo" />
          <div className="valladolid-mapa-leyenda"><span><Icono nombre="alt_route" tamano={18} />{detalle.carretera}</span><span>Distancia sin validar</span></div>
        </div>
        <div className="valladolid-tarjeta valladolid-paradas-contenedor">
          <ol className="valladolid-paradas" aria-label="Recorrido del prototipo a Valladolid">
            {detalle.paradas.map(parada => (
              <li key={parada.nombre} className={`valladolid-parada valladolid-parada-${parada.tipo}`}>
                <span className="valladolid-marcador" aria-hidden="true">{parada.tipo === 'destino' && <Icono nombre="location_on" tamano={13} />}</span>
                <div className="valladolid-parada-textos">
                  <div className="valladolid-parada-titulo"><strong>{parada.nombre}</strong>{'etiqueta' in parada && <span>{parada.etiqueta}</span>}</div>
                  <p>{parada.descripcion}</p>
                </div>
                <span className="valladolid-parada-horario">Por confirmar</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="valladolid-tarjeta valladolid-cultura" aria-labelledby="valladolid-cultura-titulo">
        <div className="valladolid-foto-cultural">
          <ImagenValladolid src={detalle.imagenCultural} alt="Convento San Bernardino de Valladolid, imagen cultural del prototipo" />
          <span className="valladolid-top-destino">Top Destino</span>
        </div>
        <div className="valladolid-cultura-contenido">
          <div><h2 id="valladolid-cultura-titulo">Descubre Valladolid a tu ritmo</h2><p>Calzada de los Frailes · Cenote Zací · Gastronomía Colonial</p></div>
          <div className="valladolid-itinerario-intro">
            <h3><Icono nombre="auto_awesome" tamano={18} />Hacer mi itinerario · Personalizado</h3>
            <p>Selecciona tu estancia para preparar tu visita. El planificador de Valladolid estará disponible en una próxima etapa.</p>
          </div>
          <fieldset className="valladolid-estancia">
            <legend>Tiempo disponible estimado</legend>
            <div className="valladolid-estancia-opciones">
              {detalle.estancias.map(opcion => (
                <label key={opcion.id}>
                  <input type="radio" name="estancia-valladolid" value={opcion.id} checked={estancia === opcion.id} onChange={() => setEstancia(opcion.id)} />
                  <span><strong>{opcion.nombre}</strong><small>({opcion.duracion})</small></span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="valladolid-lugares"><p>Paradas imperdibles del prototipo</p><ul>{detalle.lugares.map(lugar => <li key={lugar}>{lugar}</li>)}</ul></div>
          <div className="valladolid-acciones">
            <button type="button" className="valladolid-itinerario-boton" aria-describedby="valladolid-estado-planificador" onClick={() => setMensaje('El planificador de Valladolid todavía no está disponible. No se ha creado ni guardado ningún itinerario.')}>
              <span>Hacer mi itinerario en Valladolid</span><Icono nombre="arrow_forward" tamano={18} />
            </button>
            <div id="valladolid-estado-planificador" className="valladolid-estado-planificador" role="status" aria-atomic="true">{mensaje}</div>
          </div>
        </div>
      </section>
      <p id="valladolid-aviso-favorito" className="valladolid-nota-favorito" role="status" aria-atomic="true">{aviso}</p>
    </article>
  )
}
