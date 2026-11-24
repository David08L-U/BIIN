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
import { duracionPlan } from '../plan/itinerarioIzamal'
import { horaLocal, instanteLocal } from '../plan/tiempoLocal'
import { compartirHomun, descargarHomun } from '../plan/accionesHomun'
import type { AvisoCompartir } from '../plan/accionesPlan'
import { guardarItinerarioLocal } from '../storage/itinerariosLocales'
import '../../../styles/itinerario-homun.css'

function ConexionHomun({ dia }: { dia: JornadaHomun }) {
  return <section className="hm-conexion hm-tarjeta" aria-label={`Conexión BIIN del Día ${dia.dia}`}>
    <header><h2>Conexión Van BIIN</h2><span>Ruta Mérida · Homún</span><Icono nombre="airport_shuttle" tamano={20} /></header>
    <p className="hm-ceja">Día {dia.dia} · {dia.fecha}</p>
    <div className="hm-conexion-bloque"><Icono nombre="login" tamano={16} /><div><p className="hm-ceja">Inicio elegido · {horaLocal(dia, 0)}</p><strong>Homún Centro (Frente al Palacio Municipal)</strong><p>Referencia del prototipo. Llegada del transporte sin confirmar.</p></div></div>
    <p className="hm-tiempo-chip"><Icono nombre="timelapse" tamano={16} />{duracionPlan(Number(dia.minutosDisponibles))} disponibles · {dia.libresMinutos} min libres</p>
    <div className="hm-conexion-bloque"><Icono nombre="logout" tamano={16} /><div><p className="hm-ceja">Hora objetivo de regreso · {horaLocal(dia, Number(dia.minutosDisponibles))}</p><strong>Referencia de paradero en Homún</strong><p>Objetivo del usuario; no es una salida confirmada. Consulta paradero y transporte con la terminal.</p></div></div>
    <p className="hm-nota">Visitas {dia.visitasMinutos} min + traslados {dia.trasladosMinutos} min (incluye regreso) + margen {dia.margenMinutos} min = {dia.totalMinutos} min.</p>
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
    const r = guardarItinerarioLocal(usuario.idUsuario, vigente)
    setAviso({ clave: cuenta, error: !r.guardado, mensaje: r.guardado ? 'Guardado en este navegador' : r.error ?? 'No se pudo guardar el itinerario.' })
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
  return <article className="hm-plan" aria-labelledby="hm-itinerario-titulo">
    <header className="hm-cabecera"><Link className="hm-icono-boton" to={urlBorradorHomun('detalle', vigente)} aria-label="Volver a detalle de ruta"><Icono nombre="arrow_back" tamano={20} /></Link><div className="hm-titulo"><p className="hm-ceja">BIIN Escapadas</p><h1 id="hm-itinerario-titulo">Tu Itinerario en Homún</h1></div><div className="hm-utilidades"><button type="button" className="hm-icono-boton" disabled={!plan || cargando} onClick={guardar} aria-label="Guardar itinerario"><Icono nombre="bookmark_border" tamano={20} /></button><button type="button" className="hm-icono-boton" disabled={!plan || compartiendo} onClick={compartir} aria-label="Compartir"><Icono nombre="share" tamano={20} /></button></div></header>
    <div className="hm-contenido">
      <p className="hm-resumen-chip"><Icono nombre="explore" tamano={16} />Circuito de Cenotes y Aguas Sagradas · {plan ? plan.jornadas.length === 1 ? `${duracionPlan(plan.jornadas[0].totalMinutos)} estimadas` : '2 jornadas estimadas' : 'Configura tu visita'}</p>
      <p className="hm-nota">{esEstanciaHomun(estancia) ? estanciasHomun[estancia].nombre : 'Estancia sin validar'} · Plan estimado</p>
      <ModosHomun borrador={vigente} />
      <form className="hm-formulario" noValidate onSubmit={generar}><ConfiguracionHomun borrador={borrador} onChange={actualizar} /><button type="submit" className="hm-primario">Generar itinerario {borrador.modo === 'personalizado' ? 'personalizado' : 'recomendado'}<Icono nombre="arrow_forward" tamano={18} /></button></form>
      <p className="hm-nota">Datos e imágenes demostrativos, sin fecha de validación. Visitas y traslados estimados; aperturas, entradas y acceso sin confirmar. Mototaxi sin precio ni disponibilidad confirmados; no está contratado. {avisoRegresoHomun}</p>
      {errores.length > 0 && <div className="hm-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
      {!borrador.generado && <p className="hm-vacio" role="status">Aún no hay un plan vigente. Si cambiaste configuración o selección, genera de nuevo.</p>}
      {plan && <>
        {plan.jornadas.map(d => <ConexionHomun key={d.dia} dia={d} />)}
        <div className="hm-filtros" role="group" aria-label="Filtrar recorrido">{([['todas', 'Ruta Sugerida'], ['cenotes', 'Cenotes & Cavernas'], ['gastronomia', 'Gastronomía']] as const).map(([id, nombre]) => <button type="button" key={id} aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nombre}</button>)}</div>
        <section className="hm-recorrido" aria-labelledby="hm-pasos-titulo">
          <div className="hm-seccion-titulo"><h2 id="hm-pasos-titulo"><Icono nombre="timeline" tamano={16} />Paso a paso en mototaxi y a pie</h2><span>{plan.seleccion.length} lugares</span></div>
          {plan.jornadas.map(d => {
            const visitas = d.bloques.filter(b => b.tipo === 'visita')
            const visibles = visitas.filter(b => filtro === 'todas' || lugaresHomun.find(l => l.id === b.lugarId)!.categoria === filtro)
            return <section className="hm-jornada" key={d.dia} aria-labelledby={`hm-dia-${d.dia}`}>
              <h3 id={`hm-dia-${d.dia}`}>Día {d.dia} · <time dateTime={d.fecha}>{d.fecha}</time> · {duracionPlan(d.totalMinutos)}</h3>
              <ol className="hm-visitas" aria-label={`Recorrido del Día ${d.dia}`}>
                {visitas.map((bloque, i) => {
                  if (!visibles.includes(bloque)) return null
                  const l = lugaresHomun.find(l => l.id === bloque.lugarId)!
                  const traslado = d.bloques.find(b => b.tipo === 'traslado' && b.lugarId === l.id)!
                  return <li key={l.id} value={i + 1}><article className="hm-paso hm-tarjeta">
                    <div className="hm-paso-hora"><span><time dateTime={instanteLocal(d, bloque.inicio).toISOString()}>{horaLocal(d, bloque.inicio)}</time> – <time dateTime={instanteLocal(d, bloque.fin).toISOString()}>{horaLocal(d, bloque.fin)}</time></span><span className={`hm-etiqueta${l.categoria === 'gastronomia' ? ' hm-etiqueta-comida' : ''}`}>{l.etiqueta}</span><Icono nombre={l.icono} tamano={18} /></div>
                    <p className="hm-traslado"><Icono nombre={l.traslado.icono} tamano={16} />{nombreTrasladoHomun(l)} · {horaLocal(d, traslado.inicio)} – {horaLocal(d, traslado.fin)}</p>
                    {'imagen' in l && <ImagenItinerario {...l.imagen} className="hm-imagen" />}
                    <h4>{l.nombre}</h4><p>{l.descripcion}</p><p className="hm-duracion">Visita estimada: {l.visitaMinutos} min</p>
                  </article></li>
                })}
              </ol>
              {!visibles.length && <p role="status">No hay visitas de esta categoría en el Día {d.dia}. El filtro conserva el plan y sus horarios.</p>}
              <div className="hm-cierre"><h4><Icono nombre="departure_board" tamano={20} />Cierre del recorrido · Día {d.dia}</h4>{d.bloques.slice(-2).map(b => <p key={b.titulo}>{horaLocal(d, b.inicio)} – {horaLocal(d, b.fin)} · {b.titulo}: {b.fin - b.inicio} min.</p>)}<p>Tiempo libre: {d.libresMinutos} min · {horaLocal(d, d.totalMinutos)} – {horaLocal(d, Number(d.minutosDisponibles))}. El regreso es tu objetivo, no una salida confirmada.</p></div>
            </section>
          })}
        </section>
        <section className="hm-mapa hm-tarjeta" aria-labelledby="hm-mapa-titulo"><div className="hm-seccion-titulo"><h2 id="hm-mapa-titulo"><Icono nombre="map" tamano={18} />Circuito Cenotes Homún</h2><Link to={urlBorradorHomun('detalle', vigente)}>Ver detalle de ruta<Icono nombre="arrow_forward" tamano={14} /></Link></div><ImagenItinerario {...mapaHomun} className="hm-imagen" /><p className="hm-nota">Mapa ilustrativo del prototipo; no representa tu ubicación ni un circuito geográfico verificado.</p></section>
        <section className="hm-consejos" aria-labelledby="hm-consejos-titulo"><h2 id="hm-consejos-titulo"><Icono nombre="tips_and_updates" tamano={18} />Consejos de viaje BIIN</h2><div><Icono nombre="safety_check" tamano={16} /><p><strong>Consulta requisitos y servicios:</strong> confirma condiciones de acceso, uso de chaleco y qué incluye cada establecimiento.</p></div><div><Icono nombre="eco" tamano={16} /><p><strong>Conservación del agua:</strong> consulta y respeta las normas de cada cenote sobre productos, ducha y cuidado del entorno.</p></div></section>
      </>}
      <div className="hm-resumen-final">
        {!usuario && <p>Puedes preparar una vista previa sin sesión. Para guardar, inicia sesión; recuperarás este borrador.</p>}
        {avisoActual && <p className={avisoActual.error ? 'hm-error' : ''} role={avisoActual.error ? 'alert' : 'status'}>{avisoActual.mensaje}</p>}
        {compartirActual && <p role="status">{compartirActual.mensaje}</p>}
        {plan && compartirActual?.estado === 'manual' && <label>Enlace de la vista previa<input type="url" readOnly value={new URL(urlActual, window.location.origin).href} onFocus={e => e.target.select()} /></label>}
        <button type="button" className="hm-guardar" disabled={!plan || cargando} onClick={guardar}><Icono nombre="bookmark_border" tamano={18} />Guardar en Mi viaje</button>
        <div className="hm-acciones"><button type="button" disabled={!plan} onClick={descargar}><Icono nombre="download_for_offline" tamano={18} />Descargar plan</button><Link to={personalizar}><Icono nombre="tune" tamano={18} />Personalizar</Link></div>
        <p>La descarga contiene texto legible; no incluye mapas offline. Guardado local, sin sincronización con el servidor.</p>
        {usuario && <Link to="/mi-viaje">Ver mis itinerarios guardados</Link>}
      </div>
    </div>
  </article>
}
