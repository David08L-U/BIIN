import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { detalleTekitPrototipo as detalle } from '../data/detalleTekitPrototipo'
import { useFavoritoRuta } from '../hooks/useFavoritoRuta'
import { useBorradorTekit } from '../../mi-viaje/hooks/useBorradorTekit'
import { cambiarModalidadTekit, urlBorradorTekit } from '../../mi-viaje/plan/borradorTekit'
import '../../../styles/detalle-tekit.css'

function Icono({ nombre, tamano }: { nombre: string; tamano: number }) {
  return <span className="biin-icon" aria-hidden="true" style={{ fontSize: tamano }}>{nombre}</span>
}

function ImagenTekit({ src, alt }: { src: string; alt: string }) {
  const [fallo, setFallo] = useState(false)
  return fallo ? (
    <div className="tekit-imagen-alternativa" role="img" aria-label={alt}>
      <Icono nombre="image" tamano={24} /><span>Imagen del prototipo no disponible</span>
    </div>
  ) : <img className="tekit-imagen" src={src} alt={alt} onError={() => setFallo(true)} />
}

/** CU-03 / RF03: detalle propio de Tekit, con información sin confirmar. */
export default function DetalleTekitPage({ ruta }: { ruta: RutaPrototipo }) {
  const { favorito, alternarFavorito, aviso } = useFavoritoRuta(ruta.id)
  const { borrador, actualizar } = useBorradorTekit()
  const navegar = useNavigate()
  const opcion = borrador.configuracion.estancia
  const [mostrarReferencia, setMostrarReferencia] = useState(false)

  return (
    <article className="tekit-detalle" aria-labelledby="tekit-titulo">
      <header className="tekit-barra">
        <Link to="/rutas" className="tekit-boton-icono" aria-label="Volver al catálogo de rutas"><Icono nombre="arrow_back" tamano={20} /></Link>
        <span className="tekit-estado-salida"><span aria-hidden="true" />Salida · Sin confirmar</span>
        <button type="button" className="tekit-boton-icono tekit-favorito" aria-label="Guardar Tekit como favorito" aria-pressed={favorito} aria-describedby="tekit-aviso-favorito" onClick={alternarFavorito}>
          <Icono nombre={favorito ? 'favorite' : 'favorite_border'} tamano={20} />
        </button>
      </header>

      <div className="tekit-presentacion">
        <span className="tekit-etiqueta"><Icono nombre="airport_shuttle" tamano={13} /><span>{detalle.etiqueta}</span></span>
        <h1 id="tekit-titulo">Tekit</h1>
        <p>{detalle.descripcion}</p>
      </div>

      <div className="tekit-metricas">
        <section className="tekit-tarjeta tekit-metrica" aria-label="Tarifa">
          <div className="tekit-metrica-cabecera"><Icono nombre="payments" tamano={22} /><span aria-label="Medios de pago por validar">Por validar</span></div>
          <div><p className="tekit-valor">${ruta.precio} MXN</p><p className="tekit-metrica-nota">Tarifa por pasaje</p></div>
        </section>
        <section className="tekit-tarjeta tekit-metrica" aria-label="Disponibilidad">
          <div className="tekit-metrica-cabecera"><Icono nombre="airline_seat_recline_normal" tamano={22} /><span className="tekit-punto-disponibilidad" aria-hidden="true" /></div>
          <div><p className="tekit-valor">Sin confirmar</p><p className="tekit-metrica-nota">Sin reporte vigente</p></div>
        </section>
        <section className="tekit-tarjeta tekit-terminal" aria-labelledby="tekit-terminal-titulo">
          <span className="tekit-terminal-icono"><Icono nombre="directions_bus" tamano={24} /></span>
          <div className="tekit-terminal-textos"><p>Andén de salida</p><h2 id="tekit-terminal-titulo">{detalle.terminal}</h2><p>{detalle.referenciaTerminal}</p></div>
          <button type="button" className="tekit-terminal-referencia-boton" aria-label="Ver referencia de salida de Tekit" aria-expanded={mostrarReferencia} aria-controls="tekit-referencia-salida" onClick={() => setMostrarReferencia(valor => !valor)}>
            <Icono nombre="near_me" tamano={18} />
          </button>
          <div id="tekit-referencia-salida" className="tekit-terminal-referencia" role="region" aria-label="Referencia de salida de Tekit" hidden={!mostrarReferencia}>
            <p>Referencia del prototipo: {detalle.terminal}. {detalle.referenciaTerminal}. Andén y horarios sin confirmar. No representa tu ubicación ni ofrece indicaciones GPS.</p>
          </div>
        </section>
      </div>
      <p className="tekit-nota-datos">Datos del prototipo, pendientes de validar y sin fecha de validación: tarifa, duración, trazado y referencias. Salida, disponibilidad, horarios y medios de pago sin confirmar.</p>

      <section className="tekit-recorrido" aria-labelledby="tekit-recorrido-titulo">
        <div className="tekit-recorrido-cabecera"><div><h2 id="tekit-recorrido-titulo">Mapeo de ruta y paradas</h2><p>Tiempo estimado de viaje · ~{ruta.tiempo}</p></div><Icono nombre="timeline" tamano={20} /></div>
        <div className="tekit-mapa">
          <ImagenTekit src={detalle.imagenRecorrido} alt="Mapa ilustrativo del recorrido a Tekit del prototipo" />
          <p className="tekit-mapa-leyenda"><Icono nombre="navigation" tamano={16} /><span>{detalle.carretera} · Prototipo</span></p>
        </div>
        <ol className="tekit-tarjeta tekit-paradas" aria-label="Recorrido del prototipo a Tekit">
          {detalle.paradas.map(parada => (
            <li key={parada.nombre} className={`tekit-parada tekit-parada-${parada.tipo}`}>
              <span className="tekit-marcador" aria-hidden="true" />
              <div><div className="tekit-parada-titulo"><strong>{parada.nombre}</strong>{'etiqueta' in parada ? <span className="tekit-parada-etiqueta">{parada.etiqueta}</span> : <span className="tekit-parada-horario">Por confirmar</span>}</div><p>{parada.descripcion}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="tekit-tarjeta tekit-cultura" aria-labelledby="tekit-cultura-titulo">
        <div className="tekit-foto-cultural">
          <ImagenTekit src={detalle.imagenCultural} alt="Taller textil de guayaberas de Tekit, imagen cultural del prototipo" />
          <div className="tekit-foto-textos"><span>Top Destino Yucatán</span><h2 id="tekit-cultura-titulo">Descubre Tekit a tu ritmo</h2><p>Ruta Textil · Talleres de Bordado · Gastronomía Local</p></div>
        </div>
        <div className="tekit-planificador">
          <div className="tekit-itinerario-intro"><h3>Hacer mi itinerario · Personalizado</h3><p>Selecciona tu estancia o modalidad de visita. Configura tu tiempo y elige un plan recomendado o tus propias paradas.</p></div>
          <fieldset className="tekit-estancia">
            <legend className="tekit-solo-lectores">Estancia o modalidad de visita</legend>
            <div className="tekit-estancia-opciones">
              {detalle.opciones.map(elegible => <label key={elegible.id}><input type="radio" name="visita-tekit" value={elegible.id} checked={opcion === elegible.id} onChange={() => actualizar(cambiarModalidadTekit(borrador, elegible.id))} /><span><strong>{elegible.nombre}</strong><small>{elegible.detalle}</small></span></label>)}
            </div>
          </fieldset>
          <ul className="tekit-lugares" aria-label="Lugares destacados del prototipo">{detalle.lugares.map(lugar => <li key={lugar}><Icono nombre="check_circle" tamano={14} />{lugar}</li>)}</ul>
          <div className="tekit-acciones">
            <button type="button" className="tekit-itinerario-boton" onClick={() => navegar(urlBorradorTekit(borrador.modo === 'personalizado' ? 'personalizar' : 'itinerario', borrador))}><span>Hacer mi itinerario en Tekit</span><Icono nombre="arrow_forward" tamano={20} /></button>
          </div>
        </div>
      </section>
      <p id="tekit-aviso-favorito" className="tekit-nota-favorito" role="status" aria-atomic="true">{aviso}</p>
    </article>
  )
}
