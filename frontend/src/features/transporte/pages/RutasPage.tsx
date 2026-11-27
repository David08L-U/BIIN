import {
  Link,
  useOutletContext,
  useSearchParams,
} from 'react-router'

import { rutasPrototipo } from '../data/rutasPrototipo'
import '../../../styles/rutas-melanie.css'

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const moneda = (valor: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(valor)

export default function RutasPage() {
  const { abrirMenu } = useOutletContext<{
    abrirMenu: () => void
  }>()

  const [parametros, setParametros] = useSearchParams()

  const seleccionInicial = rutasPrototipo.find(
    ruta => ruta.id === parametros.get('destino'),
  )

  const busqueda =
    parametros.get('q') ??
    seleccionInicial?.nombre ??
    ''

  const tipo = parametros.get('tipo')

  const filtro =
    tipo === 'directos' || tipo === 'cenotes'
      ? tipo
      : 'todas'

  const lista = rutasPrototipo.filter(
    ruta =>
      normalizar(
        `${ruta.nombre} ${ruta.descripcion} ${ruta.etiqueta ?? ''}`,
      ).includes(normalizar(busqueda)) &&
      (filtro !== 'directos' || ruta.directo) &&
      (filtro !== 'cenotes' || ruta.cenotes),
  )

  function cambiarBusqueda(texto: string) {
    const nuevos = new URLSearchParams(parametros)

    nuevos.delete('destino')

    if (texto) {
      nuevos.set('q', texto)
    } else {
      nuevos.delete('q')
    }

    setParametros(nuevos, { replace: true })
  }

  function cambiarFiltro(
    opcion: 'todas' | 'directos' | 'cenotes',
  ) {
    const nuevos = new URLSearchParams(parametros)

    if (opcion === 'todas') {
      nuevos.delete('tipo')
    } else {
      nuevos.set('tipo', opcion)
    }

    setParametros(nuevos, { replace: true })
  }

  return (
    <section className="rutas-melanie">
      <header className="rutas-barra">
        <button
          type="button"
          className="rutas-menu"
          onClick={abrirMenu}
          aria-label="Abrir menú"
        >
          <span aria-hidden="true" className="biin-icon">
            menu
          </span>
        </button>

        <div className="rutas-buscador">
          <span aria-hidden="true" className="biin-icon">
            search
          </span>

          <input
            type="search"
            aria-label="Buscar rutas o destinos"
            placeholder="Buscar rutas o destinos..."
            value={busqueda}
            onChange={evento =>
              cambiarBusqueda(evento.target.value)
            }
          />

          {busqueda && (
            <button
              type="button"
              className="rutas-limpiar"
              aria-label="Limpiar búsqueda"
              onClick={() => cambiarBusqueda('')}
            >
              <span
                aria-hidden="true"
                className="biin-icon"
              >
                close
              </span>
            </button>
          )}
        </div>
      </header>

      <div className="rutas-saludo">
        <h1>¿A dónde viajaremos hoy?</h1>
        <p>
          Salidas frecuentes y combis colectivas desde
          Mérida
        </p>
      </div>

      <div
        className="rutas-chips"
        aria-label="Filtrar rutas"
      >
        {(
          [
            ['todas', 'alt_route', 'Todas las rutas'],
            ['directos', 'directions_bus', 'Directos'],
            ['cenotes', 'pool', 'Ruta Cenotes'],
          ] as const
        ).map(([id, icono, titulo]) => (
          <button
            type="button"
            key={id}
            className={filtro === id ? 'activo' : ''}
            aria-pressed={filtro === id}
            onClick={() => cambiarFiltro(id)}
          >
            <span aria-hidden="true" className="biin-icon">
              {icono}
            </span>
            {titulo}
          </button>
        ))}
      </div>

      <p className="rutas-nota">
        Información por confirmar: tarifas y tiempos pendientes
        de validar.
      </p>

      <p className="rutas-conteo" aria-live="polite">
        {lista.length}{' '}
        {lista.length === 1
          ? 'ruta encontrada'
          : 'rutas encontradas'}
      </p>

      <div className="rutas-catalogo">
        {lista.map(ruta => (
          <Link
            key={ruta.id}
            to={`/rutas/${ruta.id}`}
            className="rutas-tarjeta"
            aria-label={`Ver ruta a ${ruta.nombre}`}
          >
            <div className="rutas-tarjeta-cuerpo">
              <span className={`rutas-icono-destino ${ruta.id === 'izamal' ? 'relleno' : ''}`}>
                <span aria-hidden="true" className="biin-icon">{ruta.icono}</span>
              </span>

              <div className="rutas-destino-textos">
                <div className="rutas-destino-titulo">
                  <h2>{ruta.nombre}</h2>

                  {ruta.etiqueta && (
                    <span
                      className={`rutas-etiqueta ${
                        ruta.id === 'izamal'
                          ? 'popular'
                          : ''
                      }`}
                    >
                      {ruta.etiqueta}
                    </span>
                  )}
                </div>

                <p>{ruta.descripcion}</p>
              </div>

              <span className="rutas-ver">
                <span
                  aria-hidden="true"
                  className="biin-icon"
                >
                  arrow_forward
                </span>
              </span>
            </div>

            <div className="rutas-tarjeta-pie">
              <div className="rutas-metadata">
                <span>
                  <span
                    aria-hidden="true"
                    className="biin-icon"
                  >
                    schedule
                  </span>
                  {ruta.tiempo}
                </span>

                <span>
                  <span
                    aria-hidden="true"
                    className="biin-icon"
                  >
                    sync
                  </span>
                  c/ {ruta.frecuencia} min
                </span>
              </div>

              <span className="rutas-precio">
                Desde
                <strong>{moneda(ruta.precio)}</strong>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {!lista.length && (
        <div className="rutas-vacio" role="status">
          <span aria-hidden="true" className="biin-icon">
            search_off
          </span>

          <h2>No encontramos rutas</h2>

          <p>
            Prueba otro destino o cambia el filtro
            seleccionado.
          </p>

          <button
            type="button"
            onClick={() =>
              setParametros({}, { replace: true })
            }
          >
            Restablecer búsqueda
          </button>
        </div>
      )}

      <aside className="rutas-terminales">
        <span className="rutas-terminal-icono">
          <span aria-hidden="true" className="biin-icon">
            pin_drop
          </span>
        </span>

        <div>
          <strong>
            Salidas principales: Parque San Juan y Noreste
          </strong>
          <p>
            Consulta el paradero exacto al seleccionar tu
            destino.
          </p>
        </div>
      </aside>
    </section>
  )
}
