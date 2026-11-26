import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { buscarLugares, categoriasExplorar, destinosExplorar, lugaresExplorar } from '../data/lugaresExplorar'
import type { LugarExplorar } from '../data/lugaresExplorar'
import { useAuth } from '../../auth/useAuth'
import { leerItinerariosLocales, type ItinerarioGuardado } from '../../mi-viaje/storage/itinerariosLocales'
import { urlAgregarLugar, urlAgregarLugarGuardado } from '../../mi-viaje/plan/agregarLugarAItinerario'
import { urlPlanificador } from '../../mi-viaje/plan/urlsPlanificador'
import { regresarEnBIIN } from '../../../utils/navegacion'
import '../../../styles/explorar.css'

function Foto({ lugar }: { lugar: LugarExplorar }) {
  const [fallo, setFallo] = useState(false)
  return lugar.imagen && !fallo
    ? <figure className="explorar-figura"><img className="explorar-foto" src={lugar.imagen.src} alt={lugar.imagen.alt} loading="lazy" decoding="async" onError={() => setFallo(true)} /><figcaption><a href={lugar.imagen.fuente} target="_blank" rel="noreferrer">Foto: {lugar.imagen.credito}</a></figcaption></figure>
    : <div className="explorar-foto explorar-foto-vacia" role="img" aria-label={`Fotografía no disponible: ${lugar.nombre}`}>Fotografía no disponible</div>
}

function contieneLugar(item: ItinerarioGuardado, lugarId: string) {
  return item.borrador.seleccion.some(seleccion => typeof seleccion === 'string' ? seleccion === lugarId : seleccion.lugarId === lugarId)
}

function estadoFecha(fecha: string) {
  if (!fecha) return 'Fecha sin confirmar'
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const fechaPlan = new Date(`${fecha}T00:00:00`)
  return fechaPlan < hoy ? 'Fecha pasada' : fechaPlan.getTime() === hoy.getTime() ? 'Es hoy' : 'Fecha futura'
}

function AgregarLugar({ lugar }: { lugar: LugarExplorar }) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [dia, setDia] = useState(1)
  const botonRef = useRef<HTMLButtonElement>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)
  const lectura = usuario ? leerItinerariosLocales(usuario.idUsuario) : null
  const candidatos = lectura?.itinerarios.filter(i => (i.destino ?? 'izamal') === lugar.destino) ?? []
  const state = location.state as { borradorFuente?: string } | null
  const fuente = state?.borradorFuente ?? new URLSearchParams(location.search).get('borradorFuente') ?? undefined
  const destinoFuente = fuente?.match(/^\/rutas\/(izamal|valladolid|tekit|homun|ticul)/)?.[1]
  const borradorActual = destinoFuente === lugar.destino ? fuente : undefined
  const paramsActuales = new URLSearchParams(borradorActual?.split('?')[1] ?? '')
  const yaEnBorrador = lugar.destino === 'valladolid' || lugar.destino === 'homun'
    ? [1, 2].some(n => (paramsActuales.get(`dia${n}`) ?? '').split(',').includes(lugar.id))
    : (paramsActuales.get('lugares') ?? '').split(',').includes(lugar.id)
  const jornadas = (paramsActuales.get('estancia') === 'fin-de-semana') ? 2 : 1
  const reanudarIntencion = !!usuario && new URLSearchParams(location.search).get('agregarLugar') === lugar.id
  const mostrar = abierto || reanudarIntencion
  useEffect(() => { if (mostrar) cancelarRef.current?.focus() }, [mostrar])
  function cerrar() {
    setAbierto(false)
    if (reanudarIntencion) { const params = new URLSearchParams(location.search); params.delete('agregarLugar'); params.delete('borradorFuente'); navigate(`${location.pathname}${params.size ? `?${params}` : ''}`, { replace: true, state: location.state }) }
    requestAnimationFrame(() => botonRef.current?.focus())
  }
  function elegir(url: string) { setAbierto(false); navigate(url) }
  function iniciarSesion() {
    const retornoParams = new URLSearchParams(location.search)
    retornoParams.set('agregarLugar', lugar.id)
    if (borradorActual) retornoParams.set('borradorFuente', borradorActual)
    const retorno = `${location.pathname}?${retornoParams}`
    navigate('/login', { state: { desde: retorno } })
  }
  return <>
    <button ref={botonRef} type="button" className="iz-plan-primario" onClick={() => usuario ? setAbierto(true) : iniciarSesion()}>Agregar a itinerario</button>
    {mostrar && <div className="iz-dialogo-fondo" onMouseDown={e => { if (e.target === e.currentTarget) cerrar() }}><section className="iz-plan-tarjeta iz-dialogo" role="dialog" aria-modal="true" aria-labelledby={`agregar-${lugar.id}`} onKeyDown={e => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return }
      if (e.key === 'Tab') {
        const controles = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), a[href]')]
        const primero = controles[0], ultimo = controles.at(-1)
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo?.focus() }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero?.focus() }
      }
    }}>
      <h2 id={`agregar-${lugar.id}`}>Agregar {lugar.nombre}</h2><p>Elige un plan de {lugar.destinoNombre}. La selección se abrirá para que revises y generes el recorrido.</p>
      {lectura?.error && <p role="alert">{lectura.error}</p>}
      {!usuario && <button type="button" onClick={iniciarSesion}>Iniciar sesión para usar tus viajes guardados</button>}
      {borradorActual && <div className="explorar-candidato"><strong>Borrador actual · sin guardar</strong><p>{lugar.destinoNombre} · {paramsActuales.get('fecha') || 'Fecha sin confirmar'} · {estadoFecha(paramsActuales.get('fecha') ?? '')}</p>{yaEnBorrador ? <p role="status">Este lugar ya está seleccionado.</p> : <><label>Jornada<select value={dia} onChange={e => setDia(Number(e.target.value))} disabled={jornadas === 1}>{Array.from({ length: jornadas }, (_, i) => <option key={i + 1} value={i + 1}>Día {i + 1}</option>)}</select></label><button type="button" onClick={() => elegir(urlAgregarLugar(lugar.destino, lugar.id, borradorActual, undefined, dia))}>Agregar al borrador actual</button></>}</div>}
      {usuario && candidatos.map(item => {
        const fecha = item.borrador.configuracion.fecha
        const dosJornadas = item.destino === 'valladolid' || item.destino === 'homun' ? item.borrador.configuracion.estancia === 'fin-de-semana' : false
        return <div className="explorar-candidato" key={item.id}><strong>Viaje guardado · {item.borrador.modo === 'personalizado' ? 'Personalizado' : 'Recomendado'} · {lugar.destinoNombre}</strong><p>{fecha || 'Fecha sin confirmar'} · {estadoFecha(fecha)}</p>{contieneLugar(item, lugar.id) ? <p role="status">Este lugar ya está seleccionado.</p> : <><label>Jornada<select value={dia} onChange={e => setDia(Number(e.target.value))} disabled={!dosJornadas}>{Array.from({ length: dosJornadas ? 2 : 1 }, (_, i) => <option key={i + 1} value={i + 1}>Día {i + 1}</option>)}</select></label><button type="button" onClick={() => elegir(urlAgregarLugarGuardado(item, lugar.id, dia))}>Abrir este itinerario para editar</button></>}</div>
      })}
      <div className="explorar-candidato"><strong>Crear un plan nuevo · {lugar.destinoNombre}</strong><p>No modifica borradores ni viajes guardados.</p><button type="button" onClick={() => elegir(urlAgregarLugar(lugar.destino, lugar.id))}>Crear itinerario con este lugar</button></div>
      <button ref={cancelarRef} type="button" onClick={cerrar}>Cancelar</button>
    </section></div>}
  </>
}

export function ExplorarDetallePage() {
  const { destino, id } = useParams()
  const lugar = lugaresExplorar.find(item => item.destino === destino && item.id === id)
  const location = useLocation()
  const { search, state } = location
  const navigate = useNavigate()
  if (!lugar) return <section className="explorar iz-plan"><h1>Lugar no encontrado</h1><Link to="/explorar">Volver a Explorar</Link></section>
  const origen = (state as { desde?: string } | null)?.desde
  const desde = origen ?? `/explorar${search}`
  return <section className="explorar iz-plan" aria-labelledby="explorar-detalle-titulo">
    <button className="explorar-volver" type="button" onClick={() => regresarEnBIIN(navigate, origen, desde)}>← Volver a resultados</button>
    <article className="iz-plan-tarjeta explorar-detalle">
      <Foto lugar={lugar} />
      <p className="explorar-meta">{lugar.destinoNombre} · {lugar.categoriaNombre}</p>
      <h1 id="explorar-detalle-titulo">{lugar.nombre}</h1>
      <p>{lugar.descripcion}</p>
      <p className="explorar-nota">Información demostrativa, pendiente de validar.</p>
      <Link className="iz-plan-primario" to={urlPlanificador(lugar.destino, 'recomendado')}>Planear visita en {lugar.destinoNombre}</Link>
      <AgregarLugar lugar={lugar} />
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
      navigate(`/explorar${params.size ? `?${params}` : ''}`, { replace: true, state: location.state })
  }
  return <section className="explorar iz-plan" aria-labelledby="explorar-titulo">
    <header className="explorar-cabecera"><h1 id="explorar-titulo">Explorar lugares</h1><p>Descubre referencias de los cinco destinos.</p></header>
    <nav className="explorar-destinos" aria-label="Filtrar por destino">
      {[{ id: '', nombre: 'Todos' }, ...destinosExplorar].map(item => <button key={item.id || 'todos'} type="button" aria-pressed={destino === item.id} className={destino === item.id ? 'activo' : ''} onClick={() => { setDestino(item.id); actualizar(busqueda, item.id) }}>{item.nombre}</button>)}
    </nav>
    <div className="explorar-filtros">
      <label>Buscar lugares<input type="search" value={busqueda} onChange={e => { setBusqueda(e.target.value); actualizar(e.target.value) }} placeholder="Nombre o descripción" /></label>
      <label>Categoría<select value={categoria} onChange={e => { setCategoria(e.target.value); actualizar(busqueda, destino, e.target.value) }}><option value="">Todas las categorías</option>{categoriasExplorar.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
      <button type="button" className="explorar-limpiar" onClick={() => { setBusqueda(''); setDestino(''); setCategoria(''); actualizar('', '', '') }}>Limpiar filtros</button>
    </div>
    <p role="status" className="explorar-conteo">{resultados.length} {resultados.length === 1 ? 'lugar' : 'lugares'}</p>
    {resultados.length ? <div className="explorar-grid">{resultados.map(lugar => <article className="iz-plan-tarjeta explorar-card" key={`${lugar.destino}:${lugar.id}`}>
      <Foto lugar={lugar} /><p className="explorar-meta">{lugar.destinoNombre} · {lugar.categoriaNombre}</p><h2>{lugar.nombre}</h2><p>{lugar.descripcion}</p>
      <Link to={`/explorar/lugares/${lugar.destino}/${encodeURIComponent(lugar.id)}${location.search}`} state={{ desde: `${location.pathname}${location.search}`, borradorFuente: (location.state as { borradorFuente?: string } | null)?.borradorFuente }}>Ver detalle de {lugar.nombre}</Link>
    </article>)}</div> : <p role="status" className="iz-plan-tarjeta explorar-vacio">No encontramos lugares con esta búsqueda y filtros. Prueba otros términos o limpia los filtros.</p>}
    <p className="explorar-nota">Información demostrativa, pendiente de validar.</p>
  </section>
}
