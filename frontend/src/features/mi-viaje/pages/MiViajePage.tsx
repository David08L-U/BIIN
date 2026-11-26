import { useEffect, useRef, useState } from 'react'
import { duracionPlan } from '../plan/duracion'
import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { eliminarItinerarioLocal, leerItinerariosLocales, type ItinerarioGuardado } from '../storage/itinerariosLocales'
import { urlBorrador } from '../plan/borradorIzamal'
import { calcularPlan } from '../plan/itinerarioIzamal'
import { calcularPlanValladolid } from '../plan/itinerarioValladolid'
import { urlBorradorValladolid } from '../plan/borradorValladolid'
import { calcularPlanTekit } from '../plan/itinerarioTekit'
import { urlBorradorTekit } from '../plan/borradorTekit'
import { calcularPlanHomun } from '../plan/itinerarioHomun'
import { urlBorradorHomun } from '../plan/borradorHomun'
import { calcularPlanTicul } from '../plan/itinerarioTicul'
import { urlBorradorTicul } from '../plan/borradorTicul'
import '../../../styles/itinerario-izamal.css'

function EliminarViaje({ item, idUsuario, onDeleted }: { item: ItinerarioGuardado; idUsuario: number; onDeleted: () => void }) {
  const [confirmar, setConfirmar] = useState(false)
  const [error, setError] = useState('')
  const botonRef = useRef<HTMLButtonElement>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (confirmar) cancelarRef.current?.focus() }, [confirmar])
  const nombre = item.destino === 'valladolid' ? 'Valladolid' : item.destino === 'tekit' ? 'Tekit' : item.destino === 'homun' ? 'Homún' : item.destino === 'ticul' ? 'Ticul' : 'Izamal'
  const fecha = item.borrador.configuracion.fecha || 'Fecha sin confirmar'
  function cancelar() { setConfirmar(false); setError(''); requestAnimationFrame(() => botonRef.current?.focus()) }
  function eliminar() {
    const resultado = eliminarItinerarioLocal(idUsuario, item.id)
    if (!resultado.eliminado) { setError(resultado.error ?? 'No se pudo eliminar el itinerario.'); return }
    setConfirmar(false)
    onDeleted()
  }
  return <>
    <button ref={botonRef} type="button" className="iz-plan-restablecer" onClick={() => { setError(''); setConfirmar(true) }}>Eliminar viaje</button>
    {confirmar && <div className="iz-dialogo-fondo" onMouseDown={e => { if (e.target === e.currentTarget) cancelar() }}><section className="iz-plan-tarjeta iz-dialogo" role="dialog" aria-modal="true" aria-labelledby={`eliminar-${item.id}`} onKeyDown={e => {
      if (e.key === 'Escape') { e.preventDefault(); cancelar(); return }
      if (e.key === 'Tab') {
        const controles = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')]
        const primero = controles[0], ultimo = controles.at(-1)
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo?.focus() }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero?.focus() }
      }
    }}>
      <h2 id={`eliminar-${item.id}`}>¿Eliminar este viaje?</h2><p><strong>{item.borrador.modo === 'personalizado' ? 'Itinerario personalizado' : 'Itinerario recomendado'} · {nombre}</strong></p><p>{fecha}</p><p>Esta acción quitará únicamente este itinerario guardado de la cuenta actual.</p>
      {error && <p role="alert" className="iz-plan-error">{error}</p>}
      <div className="iz-dialogo-acciones"><button ref={cancelarRef} type="button" onClick={cancelar}>Cancelar</button><button type="button" className="iz-plan-primario" onClick={eliminar}>Confirmar eliminación</button></div>
    </section></div>}
  </>
}

/** CU-09: el router conserva RutaProtegida; solo se lee la cuenta actual. */
export default function MiViajePage() {
  const { usuario } = useAuth()
  if (!usuario) return null
  return <MiViajeContenido key={usuario.idUsuario} idUsuario={usuario.idUsuario} nombreUsuario={usuario.nombre} />
}

function MiViajeContenido({ idUsuario, nombreUsuario }: { idUsuario: number; nombreUsuario: string }) {
  const [lectura, setLectura] = useState(() => leerItinerariosLocales(idUsuario))
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { itinerarios, error } = lectura
  const actualizarLista = () => {
    setLectura(leerItinerariosLocales(idUsuario))
    requestAnimationFrame(() => headingRef.current?.focus())
  }
  return <section className="iz-plan iz-plan-mis-viajes" aria-labelledby="mis-viajes-titulo">
    <h1 ref={headingRef} id="mis-viajes-titulo" tabIndex={-1}>Mis itinerarios</h1>
    <p>Guardados en este navegador para {nombreUsuario}. Sin sincronización con una cuenta en el servidor.</p>
    {error && <p role="alert" className="iz-plan-error">{error}</p>}
    {!itinerarios.length && <p role="status">Todavía no hay itinerarios guardados para esta cuenta en este navegador.</p>}
    <ul>{itinerarios.map(item => {
      if (item.destino === 'ticul') {
        const plan = calcularPlanTicul(item.borrador).plan!
        return <li key={item.id} className="iz-plan-tarjeta"><h2>Ticul · {item.borrador.modo}</h2><p>{item.borrador.configuracion.fecha} · {item.borrador.configuracion.horaInicio} · {plan.seleccion.length} lugares · {duracionPlan(plan.totalMinutos)}</p><p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorradorTicul('itinerario', item.borrador)}>Abrir itinerario de Ticul</Link><Link to={urlBorradorTicul('personalizar', { ...item.borrador, modo: 'personalizado', generado: false, editarId: item.id })}>Editar itinerario</Link><EliminarViaje item={item} idUsuario={idUsuario} onDeleted={actualizarLista} /></li>
      }
      if (item.destino === 'homun') {
        const plan = calcularPlanHomun(item.borrador).plan!
        return <li key={item.id} className="iz-plan-tarjeta"><h2>Homún · {item.borrador.modo}</h2>{plan.jornadas.map(d => <p key={d.dia}>Día {d.dia} · {d.fecha} · {d.horaInicio} · {d.seleccion.length} lugares · {duracionPlan(d.totalMinutos)}</p>)}<p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorradorHomun('itinerario', item.borrador)}>Abrir itinerario de Homún</Link><Link to={urlBorradorHomun('personalizar', { ...item.borrador, modo: 'personalizado', generado: false, editarId: item.id })}>Editar itinerario</Link><EliminarViaje item={item} idUsuario={idUsuario} onDeleted={actualizarLista} /></li>
      }
      if (item.destino === 'tekit') {
        const plan = calcularPlanTekit(item.borrador).plan!
        return <li key={item.id} className="iz-plan-tarjeta"><h2>Tekit · {item.borrador.modo}</h2><p>{item.borrador.configuracion.fecha} · {item.borrador.configuracion.horaInicio} · {plan.seleccion.length} lugares · {duracionPlan(plan.totalMinutos)}</p><p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorradorTekit('itinerario', item.borrador)}>Abrir itinerario de Tekit</Link><Link to={urlBorradorTekit('personalizar', { ...item.borrador, modo: 'personalizado', generado: false, editarId: item.id })}>Editar itinerario</Link><EliminarViaje item={item} idUsuario={idUsuario} onDeleted={actualizarLista} /></li>
      }
      if (item.destino === 'valladolid') {
        const plan = calcularPlanValladolid(item.borrador).plan!
        return <li key={item.id} className="iz-plan-tarjeta"><h2>Valladolid · {item.borrador.modo}</h2>{plan.jornadas.map(dia => <p key={dia.dia}>Día {dia.dia} · {dia.fecha} · {dia.horaInicio} · {dia.seleccion.length} lugares · {duracionPlan(dia.totalMinutos)}</p>)}<p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorradorValladolid('itinerario', item.borrador)}>Abrir itinerario de Valladolid</Link><Link to={urlBorradorValladolid('personalizar', { ...item.borrador, modo: 'personalizado', generado: false, editarId: item.id })}>Editar itinerario</Link><EliminarViaje item={item} idUsuario={idUsuario} onDeleted={actualizarLista} /></li>
      }
      const plan = calcularPlan(item.borrador).plan!
      return <li key={item.id} className="iz-plan-tarjeta"><h2>Izamal · {item.borrador.modo}</h2><p>{item.borrador.configuracion.fecha} · {item.borrador.configuracion.horaInicio} · {plan.seleccion.length} lugares · {duracionPlan(plan.totalMinutos)}</p><p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorrador('itinerario', item.borrador)}>Abrir itinerario de Izamal</Link><Link to={urlBorrador('personalizar', { ...item.borrador, modo: 'personalizado', generado: false, editarId: item.id })}>Editar itinerario</Link><EliminarViaje item={item} idUsuario={idUsuario} onDeleted={actualizarLista} /></li>
    })}</ul>
    <Link className="iz-plan-primario" to="/rutas/izamal">Preparar otro itinerario en Izamal</Link>
    <Link className="iz-plan-primario" to="/rutas/valladolid">Preparar otro itinerario en Valladolid</Link>
    <Link className="iz-plan-primario" to="/rutas/tekit">Preparar otro itinerario en Tekit</Link>
    <Link className="iz-plan-primario" to="/rutas/homun">Preparar otro itinerario en Homún</Link>
    <Link className="iz-plan-primario" to="/rutas/ticul">Preparar otro itinerario en Ticul</Link>
  </section>
}
