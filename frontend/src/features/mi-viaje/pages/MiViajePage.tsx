import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../../../services/api'
import { useAuth } from '../../auth/useAuth'
import { duracionPlan } from '../plan/duracion'
import { urlBorrador } from '../plan/borradorIzamal'
import type { BorradorIzamal } from '../plan/itinerarioIzamal'
import { calcularPlan } from '../plan/itinerarioIzamal'
import { urlBorradorValladolid } from '../plan/borradorValladolid'
import type { BorradorValladolid } from '../plan/itinerarioValladolid'
import { calcularPlanValladolid } from '../plan/itinerarioValladolid'
import { urlBorradorTekit } from '../plan/borradorTekit'
import type { BorradorTekit } from '../plan/itinerarioTekit'
import { calcularPlanTekit } from '../plan/itinerarioTekit'
import { urlBorradorHomun } from '../plan/borradorHomun'
import type { BorradorHomun } from '../plan/itinerarioHomun'
import { calcularPlanHomun } from '../plan/itinerarioHomun'
import { urlBorradorTicul } from '../plan/borradorTicul'
import type { BorradorTicul } from '../plan/itinerarioTicul'
import { calcularPlanTicul } from '../plan/itinerarioTicul'
import { itinerariosApi, claveBorradorItinerario, type BorradorGuardable, type ItinerarioAnteriorApiDto } from '../api/itinerariosApi'
import { eliminarItinerarioLocal, leerItinerariosLocales, type ItinerarioGuardado } from '../storage/itinerariosLocales'
import '../../../styles/itinerario-izamal.css'

function nombreDestino(item: ItinerarioGuardado) {
  return item.destino === 'valladolid' ? 'Valladolid' : item.destino === 'tekit' ? 'Tekit' : item.destino === 'homun' ? 'Homún' : item.destino === 'ticul' ? 'Ticul' : 'Izamal'
}

function rutaItinerario(item: ItinerarioGuardado, editar = false) {
  const cambios = editar ? { modo: 'personalizado' as const, generado: false, editarId: item.id } : {}
  const pantalla = editar ? 'personalizar' : 'itinerario'
  if (item.destino === 'valladolid') return urlBorradorValladolid(pantalla, { ...(item.borrador as BorradorValladolid), ...cambios })
  if (item.destino === 'tekit') return urlBorradorTekit(pantalla, { ...(item.borrador as BorradorTekit), ...cambios })
  if (item.destino === 'homun') return urlBorradorHomun(pantalla, { ...(item.borrador as BorradorHomun), ...cambios })
  if (item.destino === 'ticul') return urlBorradorTicul(pantalla, { ...(item.borrador as BorradorTicul), ...cambios })
  return urlBorrador(pantalla, { ...(item.borrador as BorradorIzamal), ...cambios })
}

function resumen(item: ItinerarioGuardado): string[] {
  if (item.destino === 'ticul') {
    const plan = calcularPlanTicul(item.borrador).plan
    return plan ? [`${item.borrador.configuracion.fecha} · ${item.borrador.configuracion.horaInicio} · ${plan.seleccion.length} lugares · ${duracionPlan(plan.totalMinutos)}`] : []
  }
  if (item.destino === 'tekit') {
    const plan = calcularPlanTekit(item.borrador).plan
    return plan ? [`${item.borrador.configuracion.fecha} · ${item.borrador.configuracion.horaInicio} · ${plan.seleccion.length} lugares · ${duracionPlan(plan.totalMinutos)}`] : []
  }
  if (item.destino === 'homun') {
    const plan = calcularPlanHomun(item.borrador).plan
    return plan?.jornadas.map(d => `Día ${d.dia} · ${d.fecha} · ${d.horaInicio} · ${d.seleccion.length} lugares · ${duracionPlan(d.totalMinutos)}`) ?? []
  }
  if (item.destino === 'valladolid') {
    const plan = calcularPlanValladolid(item.borrador).plan
    return plan?.jornadas.map(d => `Día ${d.dia} · ${d.fecha} · ${d.horaInicio} · ${d.seleccion.length} lugares · ${duracionPlan(d.totalMinutos)}`) ?? []
  }
  const plan = calcularPlan(item.borrador).plan
  return plan ? [`${item.borrador.configuracion.fecha} · ${item.borrador.configuracion.horaInicio} · ${plan.seleccion.length} lugares · ${duracionPlan(plan.totalMinutos)}`] : []
}

function modoNombre(item: ItinerarioGuardado) {
  return item.borrador.modo === 'personalizado' ? 'Itinerario personalizado' : 'Itinerario recomendado'
}

function EliminarViaje({ item, alEliminar }: { item: ItinerarioGuardado; alEliminar: (item: ItinerarioGuardado) => Promise<string | null> }) {
  const [confirmar, setConfirmar] = useState(false)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (confirmar) cancelarRef.current?.focus() }, [confirmar])
  function cancelar() {
    setConfirmar(false)
    setError('')
    requestAnimationFrame(() => botonRef.current?.focus())
  }
  async function eliminar() {
    if (eliminando) return
    setEliminando(true)
    const resultado = await alEliminar(item)
    setEliminando(false)
    if (resultado) { setError(resultado); return }
    setConfirmar(false)
  }
  return <>
    <button ref={botonRef} type="button" className="iz-plan-restablecer" onClick={() => { setError(''); setConfirmar(true) }}>Eliminar viaje</button>
    {confirmar && <div className="iz-dialogo-fondo" onMouseDown={e => { if (e.target === e.currentTarget && !eliminando) cancelar() }}><section className="iz-plan-tarjeta iz-dialogo" role="dialog" aria-modal="true" aria-labelledby={`eliminar-${item.id}`} onKeyDown={e => {
      if (e.key === 'Escape' && !eliminando) { e.preventDefault(); cancelar(); return }
      if (e.key === 'Tab') {
        const controles = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')]
        const primero = controles[0], ultimo = controles.at(-1)
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo?.focus() }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero?.focus() }
      }
    }}>
      <h2 id={`eliminar-${item.id}`}>¿Eliminar este viaje?</h2>
      <p><strong>{modoNombre(item)} · {nombreDestino(item)}</strong></p>
      <p>{item.borrador.configuracion.fecha || 'Fecha sin confirmar'}</p>
      <p>Se eliminará únicamente este itinerario de tu cuenta.</p>
      {error && <p role="alert" className="iz-plan-error">{error}</p>}
      <div className="iz-dialogo-acciones"><button ref={cancelarRef} type="button" disabled={eliminando} onClick={cancelar}>Cancelar</button><button type="button" className="iz-plan-primario" disabled={eliminando} onClick={() => void eliminar()}>{eliminando ? 'Eliminando…' : 'Confirmar eliminación'}</button></div>
    </section></div>}
  </>
}

export default function MiViajePage() {
  const { usuario, cerrarSesion } = useAuth()
  if (!usuario) return null
  return <MiViajeContenido key={usuario.idUsuario} idUsuario={usuario.idUsuario} cerrarSesion={cerrarSesion} />
}

function MiViajeContenido({ idUsuario, cerrarSesion }: { idUsuario: number; cerrarSesion: () => void }) {
  const [locales, setLocales] = useState(() => leerItinerariosLocales(idUsuario))
  const [servidor, setServidor] = useState<ItinerarioGuardado[]>([])
  const [anteriores, setAnteriores] = useState<ItinerarioAnteriorApiDto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensajeImportacion, setMensajeImportacion] = useState('')
  const [importando, setImportando] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const cargarServidor = useCallback(async () => {
    setCargando(true)
    try {
      const [actuales, historicos] = await Promise.all([itinerariosApi.listar(), itinerariosApi.listarAnteriores()])
      setServidor(actuales)
      setAnteriores(historicos)
      setError(null)
    } catch (e) {
      if (e instanceof ApiError && e.estado === 401) cerrarSesion()
      else setError(e instanceof Error ? e.message : 'No se pudieron cargar los itinerarios de la cuenta.')
    } finally {
      setCargando(false)
    }
  }, [cerrarSesion])

  useEffect(() => {
    const timer = window.setTimeout(() => void cargarServidor(), 0)
    return () => window.clearTimeout(timer)
  }, [idUsuario, cargarServidor])

  const clavesServidor = useMemo(() => new Set(servidor.map(claveBorradorItinerario)), [servidor])
  const localesPendientes = locales.itinerarios.filter(item => !clavesServidor.has(claveBorradorItinerario(item)))
  const elementos = [...servidor, ...localesPendientes]

  async function importarLocales() {
    if (importando || !localesPendientes.length) return
    setImportando(true)
    setMensajeImportacion('')
    const fallos: string[] = []
    let confirmados = 0
    for (const item of localesPendientes) {
      try {
        await itinerariosApi.guardar(item.borrador as BorradorGuardable)
        confirmados += 1
      } catch (e) {
        if (e instanceof ApiError && e.estado === 401) { cerrarSesion(); break }
        fallos.push(nombreDestino(item))
      }
    }
    await cargarServidor()
    setImportando(false)
    if (fallos.length) setMensajeImportacion(`El servidor confirmó ${confirmados} importaciones. No se pudieron importar: ${fallos.join(', ')}. Los originales locales se conservaron.`)
    else setMensajeImportacion(`El servidor confirmó ${confirmados} itinerarios. Los originales locales se conservaron.`)
  }

  async function eliminar(item: ItinerarioGuardado): Promise<string | null> {
    try {
      if (item.id.startsWith('servidor:')) await itinerariosApi.eliminar(item.id)
      else {
        const r = eliminarItinerarioLocal(idUsuario, item.id)
        if (!r.eliminado) return r.error ?? 'No se pudo eliminar el itinerario local.'
        setLocales(leerItinerariosLocales(idUsuario))
      }
      if (item.id.startsWith('servidor:')) await cargarServidor()
      requestAnimationFrame(() => headingRef.current?.focus())
      return null
    } catch (e) {
      if (e instanceof ApiError && e.estado === 401) cerrarSesion()
      return e instanceof Error ? e.message : 'No se pudo confirmar la eliminación en el servidor.'
    }
  }

  return <section className="iz-plan iz-plan-mis-viajes" aria-labelledby="mis-viajes-titulo">
    <h1 ref={headingRef} id="mis-viajes-titulo" tabIndex={-1}>Mi viaje</h1>
    <section className="iz-plan-mis-viajes-seccion" aria-labelledby="mis-itinerarios-guardados-titulo">
      <h2 id="mis-itinerarios-guardados-titulo">Mis itinerarios guardados</h2>
    {cargando && <p role="status">Cargando itinerarios de tu cuenta…</p>}
    {error && <p role="alert" className="iz-plan-error">{error}</p>}
    {locales.error && <p role="alert" className="iz-plan-error">{locales.error}</p>}
    {localesPendientes.length > 0 && <section className="iz-plan-tarjeta" aria-label="Importar itinerarios locales">
      <p>{localesPendientes.length} itinerarios guardados solo en este navegador pueden importarse a tu cuenta. La importación no elimina los originales.</p>
      <button type="button" className="iz-plan-primario" disabled={importando} onClick={() => void importarLocales()}>{importando ? 'Importando…' : `Importar ${localesPendientes.length} a mi cuenta`}</button>
      {mensajeImportacion && <p role="status" aria-live="polite">{mensajeImportacion}</p>}
    </section>}
    {!cargando && !error && elementos.length === 0 && anteriores.length === 0 && <p role="status">Aún no tienes itinerarios guardados.</p>}
    {!cargando && elementos.length > 0 && <ul>{elementos.map(item => {
      const destino = nombreDestino(item)
      const local = !item.id.startsWith('servidor:')
      return <li key={item.id} className="iz-plan-tarjeta iz-plan-guardado">
        <div className="iz-plan-guardado-contenido">
          <h2>{destino} · {item.borrador.modo}</h2>
          {resumen(item).map((linea, index) => <p key={`${item.id}-${index}`}>{linea}</p>)}
          <p className="iz-plan-guardado-estado">{local ? 'Solo en este navegador' : 'Guardado en tu cuenta'} · {new Date(item.guardadoEn).toLocaleString('es-MX')}</p>
          <div className="iz-plan-guardado-acciones">
            <Link to={rutaItinerario(item)} aria-label={`Abrir itinerario de ${destino}`}>Abrir</Link>
            <Link to={rutaItinerario(item, true)} aria-label={`Editar itinerario de ${destino}`}>Editar</Link>
            <EliminarViaje item={item} alEliminar={eliminar} />
          </div>
        </div>
      </li>
    })}</ul>}
    {!cargando && !error && anteriores.length > 0 && <section className="iz-plan-tarjeta" aria-labelledby="itinerarios-anteriores-titulo">
      <h2 id="itinerarios-anteriores-titulo">Itinerarios anteriores</h2>
      <p>Estos registros se conservaron en su formato original. Esta versión no contiene el borrador necesario para reabrirlos o editarlos; no se modificaron ni se completaron con datos supuestos.</p>
      <ul>{anteriores.map(item => <li key={item.idItinerario}>
        <h3>{item.nombre}</h3>
        <p>{item.inicio}{item.fin !== item.inicio ? ` – ${item.fin}` : ''} · {item.actividadesRegistradas} actividades registradas</p>
      </li>)}</ul>
    </section>}
    </section>
    <section className="iz-plan-mis-viajes-seccion" aria-labelledby="crear-itinerario-titulo">
      <h2 id="crear-itinerario-titulo">Crear un itinerario</h2>
      <ul className="iz-plan-destinos-crear">
        {[
          ['izamal', 'Izamal'],
          ['valladolid', 'Valladolid'],
          ['tekit', 'Tekit'],
          ['homun', 'Homún'],
          ['ticul', 'Ticul'],
        ].map(([destino, nombre]) => {
          return <li className="iz-plan-tarjeta" key={destino}>
          <h3>{nombre}</h3>
          <Link to={`/rutas/${destino}`} aria-label={`Crear itinerario para ${nombre}`}>Crear itinerario</Link>
        </li>})}
      </ul>
    </section>
  </section>
}
