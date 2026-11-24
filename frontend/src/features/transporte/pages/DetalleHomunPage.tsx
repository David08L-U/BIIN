import { useState } from 'react'
import { Link } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { detalleHomunPrototipo as detalle } from '../data/detalleHomunPrototipo'
import type { EstanciaHomun } from '../data/detalleHomunPrototipo'
import { useFavoritoRuta } from '../hooks/useFavoritoRuta'
import '../../../styles/detalle-homun.css'

function Icono({ nombre, tamano }: { nombre: string; tamano: number }) {
  return <span className="biin-icon" aria-hidden="true" style={{ fontSize: tamano }}>{nombre}</span>
}

function ImagenHomun({ src, alt }: { src: string; alt: string }) {
  const [fallo, setFallo] = useState(false)
  return fallo ? (
    <div className="homun-imagen-alternativa" role="img" aria-label={alt}>
      <Icono nombre="image" tamano={24} /><span>Imagen del prototipo no disponible</span>
    </div>
  ) : <img className="homun-imagen" src={src} alt={alt} onError={() => setFallo(true)} />
}

/** CU-03 / RF03: composición beige propia de Homún, sin información operativa. */
export default function DetalleHomunPage({ ruta }: { ruta: RutaPrototipo }) {
  const { favorito, alternarFavorito, aviso } = useFavoritoRuta(ruta.id)
  const [estancia, setEstancia] = useState<EstanciaHomun>('medio-dia')
  const [mensaje, setMensaje] = useState('')

  return (
    <article className="homun-detalle" aria-labelledby="homun-titulo">
      <header className="homun-barra">
        <Link to="/rutas" className="homun-boton-icono" aria-label="Volver al catálogo de rutas"><Icono nombre="arrow_back" tamano={20} /></Link>
        <span className="homun-estado-salida"><span aria-hidden="true" />Salida · Sin confirmar</span>
        <button type="button" className="homun-boton-icono homun-favorito" aria-label="Guardar Homún como favorito" aria-pressed={favorito} aria-describedby="homun-aviso-favorito" onClick={alternarFavorito}>
          <Icono nombre={favorito ? 'bookmark' : 'bookmark_border'} tamano={20} />
        </button>
      </header>

      <div className="homun-presentacion">
        <span className="homun-etiqueta"><Icono nombre="airport_shuttle" tamano={14} /><span>{detalle.etiqueta}</span></span>
        <h1 id="homun-titulo">Homún</h1>
        <p>{detalle.descripcion}</p>
      </div>

      <div className="homun-metricas">
        <section className="homun-superficie homun-metrica" aria-label="Pasaje">
          <div className="homun-metrica-cabecera"><span>Pasaje</span><Icono nombre="payments" tamano={18} /></div>
          <div><p className="homun-valor">${ruta.precio} MXN</p><p className="homun-metrica-nota">Tarifa por pasaje</p></div>
        </section>
        <section className="homun-superficie homun-metrica" aria-label="Disponibilidad">
          <div className="homun-metrica-cabecera"><span>Disponibilidad</span><Icono nombre="event_seat" tamano={18} /></div>
          <div><p className="homun-valor">Sin confirmar</p><p className="homun-metrica-nota">Sin reporte vigente</p></div>
        </section>
      </div>

      <p className="homun-nota-datos">Datos del prototipo, pendientes de validar y sin fecha de validación: tarifa, duración, recorrido y referencias. Salida, disponibilidad, horarios y distancia sin confirmar.</p>

      <section className="homun-superficie homun-terminal" aria-labelledby="homun-terminal-titulo">
        <span className="homun-terminal-icono"><Icono nombre="departure_board" tamano={24} /></span>
        <div><p>Andén de salida</p><h2 id="homun-terminal-titulo">{detalle.terminal}</h2><p>{detalle.referenciaTerminal}</p></div>
      </section>

      <section className="homun-superficie homun-recorrido" aria-labelledby="homun-recorrido-titulo">
        <header className="homun-recorrido-cabecera"><div><Icono nombre="alt_route" tamano={20} /><h2 id="homun-recorrido-titulo">Mapeo de ruta y paradas</h2></div><span>~{ruta.tiempo}</span></header>
        <div className="homun-mapa">
          <ImagenHomun src={detalle.imagenRecorrido} alt="Mapa ilustrativo del recorrido a Homún del prototipo" />
          <div className="homun-mapa-leyenda"><span><span aria-hidden="true" />{detalle.corredor}</span><span>Prototipo</span></div>
        </div>
        <ol className="homun-paradas" aria-label="Recorrido del prototipo a Homún">
          {detalle.paradas.map(parada => (
            <li key={parada.nombre} className={`homun-parada homun-parada-${parada.tipo}`}>
              <span className="homun-marcador" aria-hidden="true">{parada.tipo === 'destino' && <Icono nombre="flag" tamano={14} />}</span>
              <div><div className="homun-parada-titulo"><strong>{parada.nombre}</strong>{'etiqueta' in parada && <span>{parada.etiqueta}</span>}</div><p>{parada.descripcion}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="homun-cultura" aria-labelledby="homun-cultura-titulo">
        <div className="homun-foto-cultural">
          <ImagenHomun src={detalle.imagenCultural} alt="Imagen de referencia cultural del prototipo para Homún" />
          <span className="homun-top-destino">Top Destino</span>
        </div>
        <div className="homun-cultura-contenido">
          <div><h2 id="homun-cultura-titulo">Descubre Homún a tu ritmo</h2><p>{detalle.referenciaCultural}</p></div>
          <div className="homun-itinerario-intro"><h3><Icono nombre="auto_awesome" tamano={18} />Hacer mi itinerario · Personalizado</h3><p>Selecciona tu estancia para preparar tu visita. El planificador de Homún estará disponible en una próxima etapa.</p></div>
          <fieldset className="homun-estancia">
            <legend>Tiempo disponible estimado</legend>
            <div className="homun-estancia-opciones">
              {detalle.estancias.map(opcion => <label key={opcion.id}><input type="radio" name="estancia-homun" value={opcion.id} checked={estancia === opcion.id} onChange={() => setEstancia(opcion.id)} /><span><strong>{opcion.nombre}</strong><small>({opcion.duracion})</small></span></label>)}
            </div>
          </fieldset>
          <div className="homun-lugares"><p>Lugares destacados del prototipo</p><ul aria-label="Lugares destacados de Homún">{detalle.lugares.map(lugar => <li key={lugar}>{lugar}</li>)}</ul></div>
          <div className="homun-acciones">
            <button type="button" className="homun-itinerario-boton" aria-describedby="homun-estado-planificador" onClick={() => setMensaje('El planificador de Homún todavía no está disponible. No se ha creado ni guardado ningún itinerario.')}><span>Hacer mi itinerario en Homún</span><Icono nombre="arrow_forward" tamano={18} /></button>
            <div id="homun-estado-planificador" className="homun-estado-planificador" role="status" aria-atomic="true">{mensaje}</div>
          </div>
        </div>
      </section>
      <p id="homun-aviso-favorito" className="homun-nota-favorito" role="status" aria-atomic="true">{aviso}</p>
    </article>
  )
}
