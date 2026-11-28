import { Link, useOutletContext, useSearchParams } from 'react-router'
import EstadoConsulta from '../../../components/ui/EstadoConsulta'
import { fechaHora, moneda } from '../../../utils/formatoDatos'
import { useCatalogoRutasApi } from '../hooks/useCatalogoRutasApi'
import '../../../styles/rutas-melanie.css'

export default function RutasPage() {
  const contexto = useOutletContext<{ abrirMenu: () => void } | undefined>()
  const [parametros, setParametros] = useSearchParams()
  const busqueda = parametros.get('q') ?? ''
  const filtro = parametros.get('tipo') ?? 'todas'
  const destino = parametros.get('destino') ?? ''
  const consulta = useCatalogoRutasApi(busqueda, filtro, destino)
  function cambiar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(parametros)
    if (valor) nuevos.set(clave, valor); else nuevos.delete(clave)
    if (clave === 'q') nuevos.delete('destino')
    setParametros(nuevos, { replace: true })
  }
  return <section className="rutas-melanie">
    <header className="rutas-barra"><button type="button" className="rutas-menu" onClick={contexto?.abrirMenu} aria-label="Abrir menú"><span className="biin-icon" aria-hidden="true">menu</span></button>
      <div className="rutas-buscador"><span className="biin-icon" aria-hidden="true">search</span><input type="search" aria-label="Buscar rutas o destinos" placeholder="Buscar rutas o destinos…" value={busqueda} onChange={e => cambiar('q', e.target.value)} />{(busqueda || destino) && <button type="button" aria-label="Limpiar búsqueda" onClick={() => cambiar('q', '')}>×</button>}</div>
    </header>
    <div className="rutas-saludo"><h1>¿A dónde viajaremos hoy?</h1><p>Consulta las rutas de transporte publicadas en BIIN.</p>{destino && <p>Destino: {destino}</p>}</div>
    <div className="rutas-chips" aria-label="Filtrar rutas">{[['todas', 'Todas las rutas'], ['directos', 'Sin paradas intermedias'], ['cenotes', 'Cenotes']].map(([id, nombre]) => <button type="button" key={id} aria-pressed={filtro === id} className={filtro === id ? 'activo' : ''} onClick={() => cambiar('tipo', id === 'todas' ? '' : id)}>{nombre}</button>)}</div>
    <p className="rutas-nota">Tarifas aproximadas. Consulta fecha de actualización, horarios y opciones de regreso en cada ruta.</p>
    <EstadoConsulta consulta={consulta} />
    {consulta.datos && <p className="rutas-conteo" role="status">{consulta.datos.length} {consulta.datos.length === 1 ? 'ruta encontrada' : 'rutas encontradas'}</p>}
    <div className="rutas-catalogo">{consulta.datos?.map(r => <Link key={r.idRuta} to={`/rutas/${r.idRuta}`} className="rutas-tarjeta" aria-label={`Ver ruta a ${r.destino}`}>
      <div className="rutas-tarjeta-cuerpo"><span className="rutas-icono-destino"><span className="biin-icon" aria-hidden="true">directions_bus</span></span><div className="rutas-destino-textos"><div className="rutas-destino-titulo"><h2>{r.destino}</h2><span className="rutas-etiqueta">{r.codigo}</span></div><p>{r.titulo}</p><p>{r.descripcion}</p></div><span className="rutas-ver" aria-hidden="true">→</span></div>
      <div className="rutas-tarjeta-pie"><div className="rutas-metadata"><span>{r.origen} → {r.destino}</span><span>{r.totalParadas} paradas</span></div><span className="rutas-precio">Tarifa aproximada<strong>{moneda(r.tarifaAproximada)}</strong></span></div><p className="rutas-nota">Actualizada: {fechaHora(r.actualizadoEn)}</p>
    </Link>)}</div>
    {consulta.datos?.length === 0 && <div className="rutas-vacio" role="status"><h2>No encontramos rutas</h2><p>Prueba otro destino o cambia el filtro.</p><button type="button" onClick={() => setParametros({}, { replace: true })}>Restablecer búsqueda</button></div>}
  </section>
}
