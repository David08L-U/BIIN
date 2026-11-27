import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { useFavoritoRuta } from '../hooks/useFavoritoRuta'
import '../../../styles/detalle-izamal.css'

function Icono({ nombre }: { nombre: string }) {
  return <span className="biin-icon" aria-hidden="true">{nombre}</span>
}

function ImagenPrototipo({ src, alt, icono, recorte }: {
  src?: string
  alt: string
  icono: string
  recorte?: string
}) {
  const [fallo, setFallo] = useState(false)
  const avisoId = useId()

  return fallo || !src ? (
    <div className="izamal-imagen-alternativa" role="img" aria-label={alt} aria-describedby={avisoId}>
      <Icono nombre={icono} />
      <span id={avisoId}>{src ? 'Imagen no disponible' : 'Fotografía pendiente de verificación'}</span>
    </div>
  ) : (
    <img className="izamal-imagen" src={src} alt={alt} loading="lazy" decoding="async"
      style={recorte ? { objectFit: 'cover', objectPosition: 'center' } : undefined}
      onError={() => setFallo(true)} />
  )
}

export type DatosDetalle<Id extends string> = {
  etiqueta: string
  descripcion: string
  terminal: string
  referenciaTerminal: string
  tiempo?: string
  corredor: string
  imagenRecorrido: string
  imagenCultural?: string
  recorteCultural?: string
  referenciaCultural: string
  etiquetaCultural?: string
  puebloMagico?: boolean
  notaDatos?: string
  notaRecorrido?: string
  notaRegreso?: string
  altCultural?: string
  altMapa?: string
  distintivo?: string
  tituloPrecio?: string
  notaPrecio?: string
  notaMapa?: string
  etiquetaLugares?: string
  leyenda?: string
  paradas: readonly { nombre: string; tipo: string; descripcion: string; etiqueta?: string }[]
  opciones: readonly { id: Id; nombre: string; duracion?: string }[]
  lugares: readonly (string | { nombre: string; icono: string })[]
}

export default function DetalleDestino<Id extends string>({ ruta, detalle, estancia, cambiarEstancia, abrirItinerario, referenciaSalida }: {
  referenciaSalida?: ReactNode
  ruta: RutaPrototipo
  detalle: DatosDetalle<Id>
  estancia: string
  cambiarEstancia: (id: Id) => void
  abrirItinerario: (modo: 'recomendado' | 'personalizado') => void
}) {
  const { favorito, alternarFavorito, aviso } = useFavoritoRuta(ruta.id)
  const nombre = ruta.nombre
  const esIzamal = ruta.id === 'izamal'

  return (
    <article className="izamal-detalle" aria-labelledby="izamal-titulo">
      <header className="izamal-barra">
        <Link to="/rutas" className="izamal-boton-icono" aria-label={esIzamal ? 'Volver a lista de rutas' : 'Volver al catálogo de rutas'}>
          <Icono nombre="arrow_back" />
        </Link>
        <span className="izamal-estado-salida">
          <span className="izamal-punto" aria-hidden="true" />
          Salida · Sin confirmar
        </span>
        <button
          type="button"
          className="izamal-boton-icono izamal-favorito"
          aria-label={esIzamal ? 'Guardar ruta favorita' : `Guardar ${nombre} como favorito`}
          aria-pressed={favorito}
          aria-describedby="izamal-aviso-favorito"
          onClick={alternarFavorito}
        >
          <Icono nombre={favorito ? 'favorite' : 'favorite_border'} />
        </button>
      </header>

      <div className="izamal-presentacion">
        <div className="izamal-etiquetas">
          <span className="izamal-ruta-directa">{detalle.etiqueta}</span>
          {detalle.puebloMagico && <span className="izamal-pueblo"><Icono nombre="star" />Pueblo Mágico</span>}
        </div>
        <h1 id="izamal-titulo">{nombre}</h1>
        <p>{detalle.descripcion}</p>
      </div>

      <div className="izamal-metricas">
        <section className="izamal-tarjeta izamal-metrica izamal-metrica-precio" aria-labelledby="izamal-precio">
          <div className="izamal-metrica-cabecera">
            <h2 id="izamal-precio">{detalle.tituloPrecio ?? 'Precio'}</h2>
            <span className="izamal-icono-metrica"><Icono nombre="payments" /></span>
          </div>
          <p className="izamal-valor"><strong>${ruta.precio}</strong>{' '}<span>MXN</span></p>
          <p className="izamal-metrica-nota">Tarifa por pasaje · Por confirmar</p>
          {detalle.notaPrecio && <p className="izamal-metrica-nota">{detalle.notaPrecio}</p>}
        </section>
        <section className="izamal-tarjeta izamal-metrica" aria-labelledby="izamal-asientos">
          <div className="izamal-metrica-cabecera">
            <h2 id="izamal-asientos">{esIzamal ? 'Asientos' : 'Disponibilidad'}</h2>
            <span className="izamal-icono-metrica"><Icono nombre="airline_seat_recline_normal" /></span>
          </div>
          <p className="izamal-valor izamal-valor-disponibilidad"><strong>Sin confirmar</strong></p>
          <p className="izamal-metrica-nota">Sin reporte vigente</p>
        </section>
      </div>

      <p className="izamal-nota-datos">
        {detalle.notaDatos ?? 'Información por confirmar. Salida, disponibilidad, horarios y distancia por confirmar.'}
      </p>

      <section className="izamal-tarjeta izamal-terminal" aria-labelledby="izamal-terminal">
        <span className="izamal-icono-terminal"><Icono nombre="directions_bus" /></span>
        <div>
          <p className="izamal-sobretitulo">Andén de salida</p>
          <h2 id="izamal-terminal">{detalle.terminal}</h2>
          <p>{detalle.referenciaTerminal}</p>
          {referenciaSalida}
        </div>
      </section>

      <section className="izamal-tarjeta izamal-recorrido" aria-labelledby="izamal-mapeo">
        <header className="izamal-recorrido-cabecera">
          <h2 id="izamal-mapeo"><Icono nombre="timeline" />Mapeo de ruta y paradas</h2>
          <span>{detalle.tiempo ?? ruta.tiempo}<small>Por confirmar</small></span>
        </header>
        <div className="izamal-foto-recorrido">
          <ImagenPrototipo src={detalle.imagenRecorrido} alt={detalle.altMapa ?? `Mapa ilustrativo del recorrido a ${nombre}`} icono="map" />
          <p className="izamal-pie-imagen"><Icono nombre="explore" />{detalle.corredor}</p>
        </div>
        {detalle.notaMapa && <p className="izamal-nota-recorrido">{detalle.notaMapa}</p>}
        {detalle.notaRecorrido && <p className="izamal-nota-recorrido">{detalle.notaRecorrido}</p>}
        <ol className="izamal-paradas" aria-label={esIzamal ? 'Recorrido ilustrativo' : `Recorrido ilustrativo a ${nombre}`}>
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
        {detalle.notaRegreso && <p className="izamal-nota-recorrido izamal-nota-regreso">{detalle.notaRegreso}</p>}
      </section>

      <section className="izamal-tarjeta izamal-cultura" aria-labelledby="izamal-cultura">
        <div className="izamal-foto-cultural">
          <ImagenPrototipo src={detalle.imagenCultural} alt={detalle.altCultural ?? `Imagen cultural de ${nombre}`}
            icono="temple_buddhist" recorte={detalle.recorteCultural} />
          <span className="izamal-top-destino"><Icono nombre="auto_awesome" /> {detalle.distintivo ?? 'Top Destino'}</span>
          <div className="izamal-foto-textos">
            {detalle.etiquetaCultural && <p className="izamal-pueblo-amarillo"><Icono nombre="location_on" />{detalle.etiquetaCultural}</p>}
            <h2 id="izamal-cultura">Descubre {nombre} a tu ritmo</h2>
            <p>{detalle.referenciaCultural}</p>
          </div>
        </div>
        <div className="izamal-planificador">
          <div className="izamal-itinerario-intro">
            <div className="izamal-itinerario-titulo">
              <h3><Icono nombre="edit_calendar" />Hacer mi itinerario</h3>
              <span>Personalizado</span>
            </div>
            <p>Selecciona una opción de visita para preparar un itinerario estimado o elegir los lugares de tu visita.</p>
          </div>
          <fieldset className="izamal-estancia">
            <legend>{detalle.leyenda ?? 'Tiempo de estancia:'}</legend>
            <div className="izamal-estancia-opciones">
              {detalle.opciones.map(opcion => (
                <label key={opcion.id}>
                  <input
                    type="radio"
                    name={`estancia-${ruta.id}`}
                    value={opcion.id}
                    checked={estancia === opcion.id}
                    onChange={() => cambiarEstancia(opcion.id)}
                  />
                  <span className="izamal-estancia-opcion">
                    <strong>{opcion.nombre}</strong>
                    {opcion.duracion && <small>{opcion.duracion}</small>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="izamal-lugares">
            <p className="izamal-sobretitulo">Lugares destacados:</p>
            <ul aria-label={detalle.etiquetaLugares}>
              {detalle.lugares.map(lugar => {
                const titulo = typeof lugar === 'string' ? lugar : lugar.nombre
                return <li key={titulo}><Icono nombre={typeof lugar === 'string' ? 'place' : lugar.icono} />{titulo}</li>
              })}
            </ul>
          </div>
          <div className="izamal-acciones-itinerario">
            <button type="button" className="izamal-accion-principal" onClick={() => abrirItinerario('recomendado')}>
              <Icono nombre="explore" />
              <span>Itinerario recomendado en {nombre}</span>
              <Icono nombre="arrow_forward" />
            </button>
            <button type="button" className="izamal-accion-secundaria" onClick={() => abrirItinerario('personalizado')}>
              <Icono nombre="tune" /><span>Personalizar mi itinerario</span>
            </button>
          </div>
        </div>
      </section>
      <p id="izamal-aviso-favorito" className="izamal-nota-favorito" role="status" aria-atomic="true">{aviso}</p>
    </article>
  )
}
