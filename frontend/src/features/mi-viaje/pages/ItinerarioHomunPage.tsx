import FiltrosPlan from '../components/FiltrosPlan'
import CabeceraPlan from '../components/CabeceraPlan'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import ConfiguracionHomun from '../components/ConfiguracionHomun'
import ModosHomun from '../components/ModosHomun'
import ImagenItinerario from '../components/ImagenItinerario'
import Icono from '../components/IconoItinerario'
import { avisoRegresoHomun, lugaresHomun, mapaHomun, nombreTrasladoHomun } from '../data/lugaresHomun'
import { useBorradorHomun } from '../hooks/useBorradorHomun'
import { parametrosBorradorHomun, urlBorradorHomun } from '../plan/borradorHomun'
import { calcularPlanHomun, esEstanciaHomun, estanciasHomun } from '../plan/itinerarioHomun'
import type { JornadaHomun } from '../plan/itinerarioHomun'
import { duracionPlan } from '../plan/duracion'
import { horaLocal, instanteLocal } from '../plan/tiempoLocal'
import { compartirHomun, descargarHomun } from '../plan/accionesHomun'
import type { AvisoCompartir } from '../plan/accionesPlan'
import { actualizarItinerarioLocal, guardarItinerarioLocal } from '../storage/itinerariosLocales'

function ConexionHomun({ dia }: { dia: JornadaHomun }) {
  return <section className="iz-plan-conexion iz-plan-tarjeta" aria-label={`Conexión BIIN del Día ${dia.dia}`}>
    <header><h2>Conexión Van BIIN</h2><span>Ruta Mérida · Homún</span><Icono nombre="airport_shuttle" tamano={20} /></header>
    <p className="iz-plan-ceja">Día {dia.dia} · {dia.fecha}</p>
    <div className="iz-plan-conexion-fila"><Icono nombre="login" tamano={16} /><div><p className="iz-plan-ceja">Inicio elegido · {horaLocal(dia, 0)}</p><strong>Homún Centro (Frente al Palacio Municipal)</strong><p>Referencia del prototipo. Llegada del transporte sin confirmar.</p></div></div>
    <p className="iz-plan-conexion-margen"><Icono nombre="timelapse" tamano={16} />{duracionPlan(Number(dia.minutosDisponibles))} disponibles · {duracionPlan(dia.libresMinutos)} libres</p>
    <div className="iz-plan-conexion-fila"><Icono nombre="logout" tamano={16} /><div><p className="iz-plan-ceja">Hora objetivo de regreso · {horaLocal(dia, Number(dia.minutosDisponibles))}</p><strong>Referencia de paradero en Homún</strong><p>Objetivo del usuario; no es una salida confirmada. Consulta paradero y transporte con la terminal.</p></div></div>
    <p className="iz-plan-nota">Visitas {duracionPlan(dia.visitasMinutos)} + traslados {duracionPlan(dia.trasladosMinutos)} (incluye regreso) + margen {duracionPlan(dia.margenMinutos)} = {duracionPlan(dia.totalMinutos)}.</p>
  </section>
}

export default function ItinerarioHomunPage() {
  const { borrador, actualizar } = useBorradorHomun()
  const { usuario, cargando } = useAuth()
  const navegar = useNavigate()
  const [filtro, setFiltro] = useState<'todas' | 'cenotes' | 'gastronomia'>('todas')
  const clave = parametrosBorradorHomun(borrador).toString()
  const [intento, setIntento] = useState<{ clave: string; errores: string[] } | null>(null)
  const [aviso, setAviso] = useState<{ clave: string; error: boolean; mensaje: string } | null>(null)
  const [compartido, setCompartido] = useState<{ clave: string; respuesta: AvisoCompartir } | null>(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const resultado = borrador.generado ? calcularPlanHomun(borrador) : null
  const plan = resultado?.plan ?? null
  const vigente = plan ? { ...borrador, seleccion: plan.seleccion } : borrador
  const errores = resultado?.errores ?? (intento?.clave === clave ? intento.errores : [])
  const urlActual = urlBorradorHomun('itinerario', vigente)
  const cuenta = `${usuario?.idUsuario ?? 'visitante'}:${clave}`
  const avisoActual = aviso?.clave === cuenta ? aviso : null
  const compartirActual = compartido?.clave === clave ? compartido.respuesta : null
  const personalizar = urlBorradorHomun('personalizar', { ...vigente, modo: 'personalizado', generado: false })
  const estancia = borrador.configuracion.estancia
  function generar(e: FormEvent) {
    e.preventDefault()
    const r = calcularPlanHomun(borrador)
    setIntento({ clave, errores: r.errores })
    if (r.plan) actualizar({ generado: true, seleccion: r.plan.seleccion })
  }
  function guardar() {
    if (!plan || cargando) return
    if (!usuario) { navegar('/login', { state: { desde: urlActual } }); return }
    if (borrador.editarId && !window.confirm(`¿Guardar cambios en el itinerario de Homún del ${borrador.configuracion.fecha || 'fecha sin confirmar'}?`)) return
    const r = borrador.editarId ? actualizarItinerarioLocal(usuario.idUsuario, borrador.editarId, { ...vigente, generado: true }) : guardarItinerarioLocal(usuario.idUsuario, vigente)
    setAviso({ clave: cuenta, error: !r.guardado, mensaje: r.guardado ? (borrador.editarId ? 'Cambios guardados en este navegador' : 'Guardado en este navegador') : r.error ?? 'No se pudo guardar el itinerario.' })
  }
  async function compartir() {
    if (!plan || compartiendo) return
    setCompartiendo(true)
    try { setCompartido({ clave, respuesta: await compartirHomun(new URL(urlActual, window.location.origin).href) }) }
    finally { setCompartiendo(false) }
  }
  function descargar() {
    if (!plan) return
    try { descargarHomun(vigente, plan); setAviso({ clave: cuenta, error: false, mensaje: 'Se solicitó la descarga del plan en texto.' }) }
    catch { setAviso({ clave: cuenta, error: true, mensaje: 'No se pudo descargar el plan. Revisa si el navegador permite descargar archivos.' }) }
  }
  return <article className="iz-plan iz-itinerario" aria-labelledby="hm-itinerario-titulo">
    <CabeceraPlan id="hm-itinerario-titulo" titulo="Tu Itinerario en Homún" subtitulo="BIIN Escapadas" volver={urlBorradorHomun('detalle', vigente)} acciones={<>
          <button type="button" className="iz-plan-icono-boton" disabled={!plan || cargando} onClick={guardar} aria-label={borrador.editarId ? 'Guardar cambios' : 'Guardar itinerario'}><Icono nombre="bookmark" tamano={20} /></button>
          <button type="button" className="iz-plan-icono-boton" disabled={!plan || compartiendo} onClick={compartir} aria-label="Compartir"><Icono nombre="share" tamano={20} /></button>

        </>} />
    <div className="iz-plan-contenido">
      <div className="iz-plan-estancia"><span><Icono nombre="explore" tamano={16} />Circuito de Cenotes y Aguas Sagradas · {plan ? plan.jornadas.length === 1 ? `${duracionPlan(plan.jornadas[0].totalMinutos)} estimadas` : '2 jornadas estimadas' : 'Configura tu visita'}</span><span className="iz-plan-insignia">Plan estimado</span></div>
      <p className="iz-plan-nota">{esEstanciaHomun(estancia) ? estanciasHomun[estancia].nombre : 'Estancia sin validar'}</p>
      <ModosHomun borrador={vigente} />
      <form className="iz-plan-formulario" noValidate onSubmit={generar}><ConfiguracionHomun borrador={borrador} onChange={actualizar} /><button type="submit" className="iz-plan-primario">Generar itinerario {borrador.modo === 'personalizado' ? 'personalizado' : 'recomendado'}<Icono nombre="arrow_forward" tamano={18} /></button></form>
      <p className="iz-plan-nota">Datos e imágenes demostrativos, sin fecha de validación. Visitas y traslados estimados; aperturas, entradas y acceso sin confirmar. Mototaxi sin precio ni disponibilidad confirmados; no está contratado. {avisoRegresoHomun}</p>
      {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
      {!borrador.generado && <p className="iz-plan-vacio" role="status">Aún no hay un plan vigente. Si cambiaste configuración o selección, genera de nuevo.</p>}
      {plan && <>
        {plan.jornadas.map(d => <ConexionHomun key={d.dia} dia={d} />)}
        <FiltrosPlan etiqueta="Filtrar recorrido" opciones={[
            { id: 'todas', nombre: 'Ruta Sugerida' },
            { id: 'cenotes', nombre: 'Cenotes & Cavernas' },
            { id: 'gastronomia', nombre: 'Gastronomía' },
          ]} activo={filtro} seleccionar={setFiltro} />
        <section className="iz-plan-recorrido" aria-labelledby="hm-pasos-titulo">
          <div className="iz-plan-categoria-titulo"><h2 id="hm-pasos-titulo"><Icono nombre="timeline" tamano={16} />Paso a paso en mototaxi y a pie</h2><span>{plan.seleccion.length} lugares</span></div>
          {plan.jornadas.map(d => {
            const visitas = d.bloques.filter(b => b.tipo === 'visita')
            const visibles = visitas.filter(b => filtro === 'todas' || lugaresHomun.find(l => l.id === b.lugarId)!.categoria === filtro)
            return <section className="iz-plan-jornada" key={d.dia} aria-labelledby={`hm-dia-${d.dia}`}>
              <h3 id={`hm-dia-${d.dia}`}>Día {d.dia} · <time dateTime={d.fecha}>{d.fecha}</time> · {duracionPlan(d.totalMinutos)}</h3>
              <ol className="iz-plan-linea" aria-label={`Recorrido del Día ${d.dia}`}>
                {visitas.map((bloque, i) => {
                  if (!visibles.includes(bloque)) return null
                  const l = lugaresHomun.find(l => l.id === bloque.lugarId)!
                  const traslado = d.bloques.find(b => b.tipo === 'traslado' && b.lugarId === l.id)!
                  return <li key={l.id} value={i + 1}><span className="iz-plan-orden" aria-hidden="true">{i + 1}</span><article className="iz-plan-paso iz-plan-tarjeta">
                    <div className="iz-plan-paso-hora"><span><time dateTime={instanteLocal(d, bloque.inicio).toISOString()}>{horaLocal(d, bloque.inicio)}</time> – <time dateTime={instanteLocal(d, bloque.fin).toISOString()}>{horaLocal(d, bloque.fin)}</time></span><span className="iz-plan-insignia">{l.etiqueta}</span><Icono nombre={l.icono} tamano={18} /></div>
                    <p className="iz-plan-caminata"><Icono nombre={l.traslado.icono} tamano={16} />{nombreTrasladoHomun(l)} · {horaLocal(d, traslado.inicio)} – {horaLocal(d, traslado.fin)}</p>
                    {'imagen' in l && <ImagenItinerario {...l.imagen} className="iz-plan-imagen" />}
                    <h4>{l.nombre}</h4><p>{l.descripcion}</p><p className="iz-plan-duracion">Visita estimada: {duracionPlan(l.visitaMinutos)}</p>
                  </article></li>
                })}
              </ol>
              {!visibles.length && <p role="status">No hay visitas de esta categoría en el Día {d.dia}. El filtro conserva el plan y sus horarios.</p>}
              <div className="iz-plan-cierre iz-plan-tarjeta"><h4><Icono nombre="departure_board" tamano={20} />Cierre del recorrido · Día {d.dia}</h4>{d.bloques.slice(-2).map(b => <p key={b.titulo}>{horaLocal(d, b.inicio)} – {horaLocal(d, b.fin)} · {b.titulo}: {duracionPlan(b.fin - b.inicio)}.</p>)}<p>Tiempo libre: {duracionPlan(d.libresMinutos)} · {horaLocal(d, d.totalMinutos)} – {horaLocal(d, Number(d.minutosDisponibles))}. El regreso es tu objetivo, no una salida confirmada.</p></div>
            </section>
          })}
        </section>
        <section className="iz-plan-mapa iz-plan-tarjeta" aria-labelledby="hm-mapa-titulo"><div className="iz-plan-categoria-titulo"><h2 id="hm-mapa-titulo"><Icono nombre="map" tamano={18} />Circuito Cenotes Homún</h2><Link to={urlBorradorHomun('detalle', vigente)}>Ver detalle de ruta<Icono nombre="arrow_forward" tamano={14} /></Link></div><ImagenItinerario {...mapaHomun} className="iz-plan-imagen" /><p className="iz-plan-nota">Mapa ilustrativo del prototipo; no representa tu ubicación ni un circuito geográfico verificado.</p></section>
        <section className="iz-plan-consejos" aria-labelledby="hm-consejos-titulo"><h2 id="hm-consejos-titulo"><Icono nombre="tips_and_updates" tamano={18} />Consejos de viaje BIIN</h2><div><Icono nombre="safety_check" tamano={16} /><p><strong>Consulta requisitos y servicios:</strong> confirma condiciones de acceso, uso de chaleco y qué incluye cada establecimiento.</p></div><div><Icono nombre="eco" tamano={16} /><p><strong>Conservación del agua:</strong> consulta y respeta las normas de cada cenote sobre productos, ducha y cuidado del entorno.</p></div></section>
      </>}
      <div className="iz-plan-resumen-final">
        {!usuario && <p>Puedes preparar una vista previa sin sesión. Para guardar, inicia sesión; recuperarás este borrador.</p>}
        {avisoActual && <p className={avisoActual.error ? 'iz-plan-error' : ''} role={avisoActual.error ? 'alert' : 'status'}>{avisoActual.mensaje}</p>}
        {compartirActual && <p role="status">{compartirActual.mensaje}</p>}
        {plan && compartirActual?.estado === 'manual' && <label>Enlace de la vista previa<input type="url" readOnly value={new URL(urlActual, window.location.origin).href} onFocus={e => e.target.select()} /></label>}
        <div className="iz-plan-acciones iz-plan-acciones-completas"><button type="button" className="iz-plan-guardar" disabled={!plan || cargando} onClick={guardar}><Icono nombre="bookmark_border" tamano={18} />Guardar en Mi viaje</button><button type="button" disabled={!plan} onClick={descargar}><Icono nombre="download_for_offline" tamano={18} />Descargar plan</button><Link to={personalizar}><Icono nombre="tune" tamano={18} />Personalizar</Link></div>
        <p>La descarga contiene texto legible; no incluye mapas offline. Guardado local, sin sincronización con el servidor.</p>
        {usuario && <Link to="/mi-viaje">Ver mis itinerarios guardados</Link>}
      </div>
    </div>
  </article>
}
