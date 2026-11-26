import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { buscarLugares, categoriasExplorar, destinosExplorar, lugaresExplorar } from '../data/lugaresExplorar'
import type { LugarExplorar } from '../data/lugaresExplorar'
import { urlPlanificador } from '../../mi-viaje/plan/urlsPlanificador'
import '../../../styles/explorar.css'

function Foto({ lugar }: { lugar: LugarExplorar }) {
  const [fallo, setFallo] = useState(false)
  return lugar.imagen && !fallo
    ? <img className="explorar-foto" src={lugar.imagen.src} alt={lugar.imagen.alt} onError={() => setFallo(true)} />
    : <div className="explorar-foto explorar-foto-vacia" role="img" aria-label={`Fotografía no disponible: ${lugar.nombre}`}>Fotografía no disponible</div>
}

export function ExplorarDetallePage() {
  const { destino, id } = useParams()
  const lugar = lugaresExplorar.find(item => item.destino === destino && item.id === id)
  const { search, state } = useLocation()
  const navigate = useNavigate()
  if (!lugar) return <section className="explorar iz-plan"><h1>Lugar no encontrado</h1><Link to="/explorar">Volver a Explorar</Link></section>
  const origen = (state as { desde?: string } | null)?.desde
  const desde = origen ?? `/explorar${search}`
  return <section className="explorar iz-plan" aria-labelledby="explorar-detalle-titulo">
    <button className="explorar-volver" type="button" onClick={() => origen ? navigate(-1) : navigate(desde)}>← Volver a resultados</button>
    <article className="iz-plan-tarjeta explorar-detalle">
      <Foto lugar={lugar} />
      <p className="explorar-meta">{lugar.destinoNombre} · {lugar.categoriaNombre}</p>
      <h1 id="explorar-detalle-titulo">{lugar.nombre}</h1>
      <p>{lugar.descripcion}</p>
      <p className="explorar-nota">Referencia demostrativa del prototipo; la información está pendiente de validación.</p>
      <Link className="iz-plan-primario" to={urlPlanificador(lugar.destino, 'recomendado')}>Planear visita en {lugar.destinoNombre}</Link>
    </article>
  </section>
}

export default function ExplorarPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const parametros = new URLSearchParams(location.search)
  const [busqueda, setBusqueda] = useState(parametros.get('q') ?? '')
  const [destino, setDestino] = useState(parametros.get('destino') ?? '')
  const [categoria, setCategoria] = useState(parametros.get('categoria') ?? '')
  const resultados = buscarLugares(busqueda, destino, categoria)
  function actualizar(query = busqueda, destinoActual = destino, categoriaActual = categoria) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (destinoActual) params.set('destino', destinoActual)
    if (categoriaActual) params.set('categoria', categoriaActual)
    navigate(`/explorar${params.size ? `?${params}` : ''}`, { replace: true })
  }
  return <section className="explorar iz-plan" aria-labelledby="explorar-titulo">
    <header className="explorar-cabecera"><h1 id="explorar-titulo">Explorar lugares</h1><p>Descubre referencias de los cinco destinos.</p></header>
    <div className="explorar-filtros">
      <label>Buscar lugares<input type="search" value={busqueda} onChange={e => { setBusqueda(e.target.value); actualizar(e.target.value) }} placeholder="Nombre o descripción" /></label>
      <label>Destino<select value={destino} onChange={e => { setDestino(e.target.value); actualizar(busqueda, e.target.value) }}><option value="">Todos los destinos</option>{destinosExplorar.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
      <label>Categoría<select value={categoria} onChange={e => { setCategoria(e.target.value); actualizar(busqueda, destino, e.target.value) }}><option value="">Todas las categorías</option>{categoriasExplorar.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
      <button type="button" className="explorar-limpiar" onClick={() => { setBusqueda(''); setDestino(''); setCategoria(''); actualizar('', '', '') }}>Limpiar filtros</button>
    </div>
    <p role="status" className="explorar-conteo">{resultados.length} {resultados.length === 1 ? 'lugar' : 'lugares'}</p>
    {resultados.length ? <div className="explorar-grid">{resultados.map(lugar => <article className="iz-plan-tarjeta explorar-card" key={`${lugar.destino}:${lugar.id}`}>
      <Foto lugar={lugar} /><p className="explorar-meta">{lugar.destinoNombre} · {lugar.categoriaNombre}</p><h2>{lugar.nombre}</h2><p>{lugar.descripcion}</p>
      <Link to={`/explorar/lugares/${lugar.destino}/${encodeURIComponent(lugar.id)}${location.search}`} state={{ desde: `${location.pathname}${location.search}` }}>Ver detalle de {lugar.nombre}</Link>
    </article>)}</div> : <p role="status" className="iz-plan-tarjeta explorar-vacio">No encontramos lugares con esta búsqueda y filtros. Prueba otros términos o limpia los filtros.</p>}
    <p className="explorar-nota">Datos demostrativos del prototipo, pendientes de validación.</p>
  </section>
}
