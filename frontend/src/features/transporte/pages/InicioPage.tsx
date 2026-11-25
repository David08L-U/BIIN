import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router'
import MapaInicio from '../components/MapaInicio'

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
      <div className="melanie-mapa" role="region" aria-label="Mapa de Inicio">
        <MapaInicio />

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
