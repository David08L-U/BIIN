import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { detalleTiculPrototipo as detalle } from '../data/detalleTiculPrototipo'
import { useFavoritoRuta } from '../hooks/useFavoritoRuta'
import { useBorradorTicul } from '../../mi-viaje/hooks/useBorradorTicul'
import { cambiarModalidadTicul, urlBorradorTicul } from '../../mi-viaje/plan/borradorTicul'
import '../../../styles/detalle-ticul.css'

function Icono({ nombre, tamano }: { nombre: string; tamano: number }) {
  return <span className="biin-icon" aria-hidden="true" style={{ fontSize: tamano }}>{nombre}</span>
}

function ImagenTicul({ src, alt }: { src: string; alt: string }) {
  const [fallo, setFallo] = useState(false)
  return fallo ? (
    <div className="ticul-imagen-alternativa" role="img" aria-label={alt}>
      <Icono nombre="image" tamano={18} /><span>Imagen del prototipo no disponible</span>
    </div>
  ) : <img className="ticul-imagen" src={src} alt={alt} onError={() => setFallo(true)} />
}

/** CU-03 / RF03: composición propia de Ticul, con mapa ilustrativo y modalidades. */
export default function DetalleTiculPage({ ruta }: { ruta: RutaPrototipo }) {
  const { favorito, alternarFavorito, aviso } = useFavoritoRuta(ruta.id)
  const { borrador, actualizar } = useBorradorTicul()
  const estancia = borrador.configuracion.estancia
  const navegar = useNavigate()

  return (
    <article className="ticul-detalle" aria-labelledby="ticul-titulo">
      <header className="ticul-barra">
        <Link to="/rutas" className="ticul-boton-icono" aria-label="Volver al catálogo de rutas"><Icono nombre="arrow_back" tamano={18} /></Link>
        <span className="ticul-estado-salida"><span aria-hidden="true" />Salida · Sin confirmar</span>
        <button type="button" className="ticul-boton-icono ticul-favorito" aria-label="Guardar Ticul como favorito" aria-pressed={favorito} aria-describedby="ticul-aviso-favorito" onClick={alternarFavorito}>
          <Icono nombre={favorito ? 'favorite' : 'favorite_border'} tamano={18} />
        </button>
      </header>

      <div className="ticul-presentacion">
        <span className="ticul-etiqueta">{detalle.etiqueta}</span>
        <h1 id="ticul-titulo">Ticul</h1>
        <p>{detalle.descripcion}</p>
      </div>

      <div className="ticul-metricas">
        <section className="ticul-superficie ticul-metrica" aria-label="Tarifa por pasaje">
          <div className="ticul-metrica-cabecera"><span>Tarifa por pasaje</span><span className="ticul-icono-circular"><Icono nombre="payments" tamano={18} /></span></div>
          <div><p className="ticul-valor">${ruta.precio} MXN</p><p className="ticul-metrica-nota">Medios de pago sin confirmar</p></div>
        </section>
        <section className="ticul-superficie ticul-metrica" aria-label="Disponibilidad">
          <div className="ticul-metrica-cabecera"><span>Disponibilidad</span><span className="ticul-icono-circular"><Icono nombre="airline_seat_recline_normal" tamano={18} /></span></div>
          <div><p className="ticul-valor">Sin confirmar</p><p className="ticul-metrica-nota">Sin reporte vigente</p></div>
        </section>
      </div>

      <section className="ticul-superficie ticul-terminal" aria-labelledby="ticul-terminal-titulo">
        <span className="ticul-terminal-icono"><Icono nombre="directions_bus" tamano={18} /></span>
        <div><p className="ticul-terminal-referencia"><span>Andén de salida</span><span aria-hidden="true" />{detalle.referenciaTerminal}</p><h2 id="ticul-terminal-titulo">{detalle.terminal}</h2></div>
        <Icono nombre="pin_drop" tamano={18} />
      </section>
      <p className="ticul-nota-datos">Tarifa, duración, recorrido y referencias del prototipo: pendientes de validar, sin fecha de validación.</p>

      <section className="ticul-recorrido" aria-labelledby="ticul-recorrido-titulo">
        <header className="ticul-recorrido-cabecera"><div><h2 id="ticul-recorrido-titulo">Mapeo de ruta y paradas</h2><p>Duración aproximada · ~{ruta.tiempo}</p></div><span>{detalle.corredor}</span></header>
        <div className="ticul-mapa">
          <ImagenTicul src={detalle.imagenRecorrido} alt="Mapa ilustrativo del recorrido a Ticul del prototipo" />
          <span className="ticul-carretera"><Icono nombre="alt_route" tamano={12} />{detalle.referenciaMapa}</span>
          <div className="ticul-mapa-leyenda"><div><span>Mapa ilustrativo</span><span>Prototipo</span></div><span>Sin verificar</span></div>
        </div>
        <ol className="ticul-superficie ticul-paradas" aria-label="Recorrido del prototipo a Ticul">
          {detalle.paradas.map(parada => (
            <li key={parada.nombre} className={`ticul-parada ticul-parada-${parada.tipo}`}>
              <span className="ticul-marcador" aria-hidden="true">{parada.tipo === 'destino' && <Icono nombre="location_on" tamano={12} />}</span>
              <div><div className="ticul-parada-titulo"><strong>{parada.nombre}</strong>{'etiqueta' in parada && <span>{parada.etiqueta}</span>}</div><p>{parada.descripcion}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="ticul-cultura" aria-labelledby="ticul-cultura-titulo">
        <div className="ticul-foto-cultural">
          <ImagenTicul src={detalle.imagenCultural} alt="Imagen de artesanía y taller del prototipo para Ticul" />
          <div className="ticul-foto-textos"><span className="ticul-top-destino"><Icono nombre="auto_awesome" tamano={12} />Top Destino del Sur</span><h2 id="ticul-cultura-titulo">Descubre Ticul a tu ritmo</h2><p>{detalle.referenciaCultural}</p></div>
        </div>
        <div className="ticul-itinerario-intro"><h3><Icono nombre="schedule" tamano={14} />Hacer mi itinerario · Personalizado</h3><p>Selecciona tu estancia o modalidad. Configura tu tiempo y elige un recorrido recomendado o tus propias paradas.</p></div>
        <fieldset className="ticul-estancia">
          <legend>Estancia o modalidad</legend>
          <div className="ticul-estancia-opciones">
            {detalle.estancias.map(opcion => <label key={opcion.id}><input type="radio" name="estancia-ticul" value={opcion.id} checked={estancia === opcion.id} onChange={() => actualizar(cambiarModalidadTicul(borrador, opcion.id))} /><span>{opcion.nombre}</span></label>)}
          </div>
        </fieldset>
        <div className="ticul-lugares"><p>Lugares destacados del prototipo</p><ul aria-label="Lugares destacados de Ticul">{detalle.lugares.map(lugar => <li key={lugar.nombre}><Icono nombre={lugar.icono} tamano={12} />{lugar.nombre}</li>)}</ul></div>
        <div className="ticul-acciones">
          <button type="button" className="ticul-itinerario-boton" onClick={() => navegar(urlBorradorTicul(borrador.modo === 'personalizado' ? 'personalizar' : 'itinerario', borrador))}><span><Icono nombre="route" tamano={18} /><span>Hacer mi itinerario en Ticul</span></span><Icono nombre="arrow_forward" tamano={18} /></button>
        </div>
      </section>
      <p id="ticul-aviso-favorito" className="ticul-nota-favorito" role="status" aria-atomic="true">{aviso}</p>
    </article>
  )
}
