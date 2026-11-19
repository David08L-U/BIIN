import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router'
import MapaBase from '../../../maps/MapaBase'
import mapaMelanie from '../../../assets/mapa-melanie.svg?raw'

const paradas = [
  {
    nombre: 'Terminal Noreste',
    etiqueta: 'Term. Noreste',
    x: 45,
    y: 46,
    referencia: 'Punto de abordaje mostrado en el prototipo.',
  },
  {
    nombre: 'Parque La Plancha',
    etiqueta: 'La Plancha',
    x: 58,
    y: 31,
    referencia: 'Interconexión ilustrativa del prototipo.',
  },
  {
    nombre: 'Chichí Suárez',
    etiqueta: 'Chichí Suárez',
    x: 77,
    y: 38,
    referencia: 'Parada mostrada en el diseño original.',
  },
  {
    nombre: 'Kanasín Centro',
    etiqueta: 'Kanasín Centro',
    x: 81,
    y: 66,
    referencia: 'Parada principal del diseño de referencia.',
  },
  {
    nombre: 'Estación Teya',
    etiqueta: 'Teya',
    x: 91,
    y: 88,
    referencia: 'Conexión multimodal del prototipo.',
  },
]

// Valores del prototipo, pendientes de validar con operadores.
const destinos = [
  {
    id: 'izamal',
    nombre: 'Izamal',
    descripcion: 'Ciudad de las Tres Culturas',
    tiempo: '1 h 15 min',
    precio: '$50',
    icono: 'temple_buddhist',
    directo: true,
    cenotes: false,
  },
  {
    id: 'valladolid',
    nombre: 'Valladolid',
    descripcion: 'Centro histórico y cenotes',
    tiempo: '2 h 10 min',
    precio: '$120',
    icono: 'church',
    directo: true,
    cenotes: true,
  },
  {
    id: 'tekit',
    nombre: 'Tekit',
    descripcion: 'Capital de la Guayabera',
    tiempo: '1 h 05 min',
    precio: '$45',
    icono: 'checkroom',
    directo: true,
    cenotes: false,
  },
  {
    id: 'homun',
    nombre: 'Homún',
    descripcion: 'Ruta de cenotes',
    tiempo: '55 min',
    precio: '$38',
    icono: 'water_drop',
    directo: false,
    cenotes: true,
  },
  {
    id: 'ticul',
    nombre: 'Ticul',
    descripcion: 'La Perla del Sur',
    tiempo: '1 h 30 min',
    precio: '$60',
    icono: 'museum',
    directo: true,
    cenotes: false,
  },
]

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export default function InicioPage() {
  const { abrirMenu } = useOutletContext<{
    abrirMenu: () => void
  }>()

  const navegar = useNavigate()

  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<
    'todas' | 'directos' | 'cenotes'
  >('todas')

  const [parada, setParada] = useState<
    (typeof paradas)[number] | null
  >(null)

  const [escala, setEscala] = useState(1)

  const [desplazamiento, setDesplazamiento] = useState({
    x: 0,
    y: 0,
  })

  const arrastre = useRef<{
    x: number
    y: number
    dx: number
    dy: number
  } | null>(null)

  const [mapaReal, setMapaReal] = useState(false)
  const [aviso, setAviso] = useState('')

  const lista = destinos.filter(
    destino =>
      normalizar(
        `${destino.nombre} ${destino.descripcion}`,
      ).includes(normalizar(busqueda)) &&
      (filtro !== 'directos' || destino.directo) &&
      (filtro !== 'cenotes' || destino.cenotes),
  )

  function buscar(evento: FormEvent) {
    evento.preventDefault()

    navegar(
      `/rutas${
        busqueda.trim()
          ? `?q=${encodeURIComponent(busqueda.trim())}`
          : ''
      }`,
    )
  }

  return (
    <section className="melanie-inicio">
      <div className="melanie-mapa">
        {mapaReal ? (
          <MapaBase
            centro={[20.967, -89.62]}
            zoom={14}
            alto="100%"
          />
        ) : (
          <div
            className="melanie-mapa-arrastre"
            onPointerDown={evento => {
              if (
                (evento.target as HTMLElement).closest('button')
              ) {
                return
              }

              arrastre.current = {
                x: evento.clientX,
                y: evento.clientY,
                dx: desplazamiento.x,
                dy: desplazamiento.y,
              }

              evento.currentTarget.setPointerCapture(
                evento.pointerId,
              )
            }}
            onPointerMove={evento => {
              if (!arrastre.current) return

              setDesplazamiento({
                x: Math.max(
                  -145,
                  Math.min(
                    145,
                    arrastre.current.dx +
                      evento.clientX -
                      arrastre.current.x,
                  ),
                ),
                y: Math.max(
                  -170,
                  Math.min(
                    170,
                    arrastre.current.dy +
                      evento.clientY -
                      arrastre.current.y,
                  ),
                ),
              })
            }}
            onPointerUp={() => {
              arrastre.current = null
            }}
            onPointerCancel={() => {
              arrastre.current = null
            }}
          >
            <div
              className="melanie-mapa-capa"
              style={{
                transform: `translate(${desplazamiento.x}px, ${desplazamiento.y}px) scale(${escala})`,
              }}
            >
              {/* SVG local original del equipo. */}
              <div
                className="melanie-mapa-svg"
                aria-hidden="true"
                dangerouslySetInnerHTML={{
                  __html: mapaMelanie,
                }}
              />

              {paradas.map(punto => (
                <button
                  key={punto.nombre}
                  className="melanie-parada"
                  style={{
                    left: `${punto.x}%`,
                    top: `${punto.y}%`,
                  }}
                  aria-label={`Ver parada ${punto.nombre}`}
                  onClick={() => {
                    setParada(punto)
                    setAviso('')
                  }}
                >
                  <span className="melanie-parada-punto" />
                  <span className="melanie-parada-nombre">
                    {punto.etiqueta}
                  </span>
                </button>
              ))}

              <button
                className="melanie-origen"
                aria-label="Ver origen ilustrativo del prototipo"
                onClick={() => {
                  setParada(null)
                  setAviso(
                    'Marcador ilustrativo del prototipo. No representa tu ubicación GPS.',
                  )
                }}
              >
                <span className="melanie-origen-badge">
                  <i />
                  Estás aquí
                </span>

                <span className="melanie-origen-foto">
                  <span className="melanie-origen-recorte">
                    <img
                      src="/assets/marquesita-melanie.jpg"
                      alt="Marquesita yucateca del prototipo"
                    />
                  </span>
                </span>

                <span className="melanie-origen-punta" />
              </button>
            </div>
          </div>
        )}

        <form
          className="melanie-buscador"
          onSubmit={buscar}
        >
          <button
            className="biin-icon-button"
            type="button"
            onClick={abrirMenu}
            aria-label="Abrir menú"
          >
            <span aria-hidden="true" className="biin-icon">
              menu
            </span>
          </button>

          <label className="melanie-busqueda">
            <span aria-hidden="true" className="biin-icon">
              search
            </span>

            <input
              aria-label="Buscar rutas o destinos"
              placeholder="Buscar rutas o destinos"
              value={busqueda}
              onChange={evento =>
                setBusqueda(evento.target.value)
              }
            />

            <button
              className="melanie-marca-badge"
              type="submit"
              aria-label="Buscar destino"
            >
              BIIN
              <i />
            </button>
          </label>
        </form>

        {parada && !mapaReal && (
          <div
            className="melanie-parada-ficha"
            role="status"
          >
            <button
              className="melanie-cerrar"
              aria-label="Cerrar detalles"
              onClick={() => setParada(null)}
            >
              ×
            </button>

            <strong>{parada.nombre}</strong>
            <p>{parada.referencia}</p>
            <Link to="/rutas">Consultar rutas</Link>
          </div>
        )}

        {aviso && (
          <div
            className="melanie-parada-ficha"
            role="status"
          >
            <button
              className="melanie-cerrar"
              aria-label="Cerrar aviso"
              onClick={() => setAviso('')}
            >
              ×
            </button>

            {aviso}
          </div>
        )}

        <div className="melanie-controles">
          <button
            className="biin-icon-button"
            aria-label="Restablecer mapa"
            onClick={() => {
              setEscala(1)
              setDesplazamiento({ x: 0, y: 0 })
              setParada(null)
              setAviso('')
              setMapaReal(false)
            }}
          >
            <span aria-hidden="true" className="biin-icon">
              my_location
            </span>
          </button>

          <button
            className="biin-icon-button"
            aria-label={
              mapaReal
                ? 'Ver mapa ilustrado'
                : 'Ver mapa real'
            }
            aria-pressed={mapaReal}
            onClick={() => {
              setMapaReal(valor => !valor)
              setParada(null)
              setAviso('')
            }}
          >
            <span aria-hidden="true" className="biin-icon">
              layers
            </span>
          </button>

          {!mapaReal && (
            <div className="melanie-zoom">
              <button
                aria-label="Acercar mapa"
                disabled={escala >= 1.6}
                onClick={() =>
                  setEscala(valor =>
                    Math.min(1.6, valor + 0.15),
                  )
                }
              >
                <span
                  aria-hidden="true"
                  className="biin-icon"
                >
                  add
                </span>
              </button>

              <button
                aria-label="Alejar mapa"
                disabled={escala <= 1}
                onClick={() =>
                  setEscala(valor =>
                    Math.max(1, valor - 0.15),
                  )
                }
              >
                <span
                  aria-hidden="true"
                  className="biin-icon"
                >
                  remove
                </span>
              </button>
            </div>
          )}
        </div>

        {!mapaReal && (
          <small className="melanie-mapa-nota">
            Mapa ilustrativo del prototipo
          </small>
        )}
      </div>

      <aside className="melanie-panel">
        <div className="melanie-tirador" />

        <h1>¿A dónde viajaremos hoy?</h1>
        <p>
          Explora las rutas y encuentra tu próxima parada
        </p>

        <div className="melanie-acciones">
          <Link
            to="/rutas"
            className="melanie-accion-principal"
          >
            <span aria-hidden="true" className="biin-icon">
              alt_route
            </span>
            Rutas
          </Link>

          <Link
            to="/recorridos"
            className="melanie-accion-secundaria"
          >
            <span aria-hidden="true" className="biin-icon">
              calendar_month
            </span>
            Itinerario
          </Link>
        </div>
      </aside>

      <section className="melanie-rutas-inicio">
        <div className="melanie-rutas-titulo">
          <h2>Rutas desde Mérida</h2>
          <Link to="/rutas">Ver todas</Link>
        </div>

        <p>
          Elige un destino para consultar su recorrido y
          planear tu viaje.
        </p>

        <div
          className="melanie-filtros"
          aria-label="Filtrar rutas"
        >
          {(['todas', 'directos', 'cenotes'] as const).map(
            opcion => (
              <button
                key={opcion}
                className={
                  filtro === opcion ? 'activo' : ''
                }
                aria-pressed={filtro === opcion}
                onClick={() => setFiltro(opcion)}
              >
                {opcion === 'todas'
                  ? 'Todas'
                  : opcion === 'directos'
                    ? 'Directos'
                    : 'Cenotes'}
              </button>
            ),
          )}
        </div>

        <p className="melanie-datos-aviso">
          Tarifas y tiempos del prototipo, pendientes de
          validar.
        </p>

        <div className="melanie-lista-rutas">
          {lista.map(destino => (
            <Link
              key={destino.id}
              to={`/rutas?destino=${destino.id}`}
              aria-label={`Ver ruta a ${destino.nombre}`}
              className="melanie-ruta-card"
            >
              <span className="melanie-ruta-icono">
                <span
                  aria-hidden="true"
                  className="biin-icon"
                >
                  {destino.icono}
                </span>
              </span>

              <span className="melanie-ruta-info">
                <strong>{destino.nombre}</strong>
                <small>{destino.descripcion}</small>

                <span className="melanie-ruta-meta">
                  ◷ {destino.tiempo}
                  <b>Desde {destino.precio}</b>
                </span>
              </span>

              <span
                aria-hidden="true"
                className="biin-icon melanie-ruta-ver"
              >
                chevron_right
              </span>
            </Link>
          ))}
        </div>

        {!lista.length && (
          <p className="melanie-sin-rutas" role="status">
            No hay rutas para esta búsqueda y filtro.
          </p>
        )}
      </section>
    </section>
  )
}