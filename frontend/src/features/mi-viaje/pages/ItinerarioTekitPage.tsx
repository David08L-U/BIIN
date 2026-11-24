import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import ConfiguracionTekit from '../components/ConfiguracionTekit'
import ModosTekit from '../components/ModosTekit'
import Icono from '../components/IconoItinerario'
import { lugaresTekit } from '../data/lugaresTekit'
import { useBorradorTekit } from '../hooks/useBorradorTekit'
import { parametrosBorradorTekit, urlBorradorTekit } from '../plan/borradorTekit'
import { calcularPlanTekit, esModalidadTekit, modalidadesTekit } from '../plan/itinerarioTekit'
import { duracionPlan } from '../plan/itinerarioIzamal'
import { horaLocal, instanteLocal } from '../plan/tiempoLocal'
import { compartirTekit, descargarTekit } from '../plan/accionesTekit'
import type { AvisoCompartir } from '../plan/accionesPlan'
import { guardarItinerarioLocal } from '../storage/itinerariosLocales'
import '../../../styles/itinerario-tekit.css'

export default function ItinerarioTekitPage() {
  const { borrador, actualizar } = useBorradorTekit()
  const { usuario, cargando } = useAuth()
  const navegar = useNavigate()
  const [filtro, setFiltro] = useState<'todas' | 'textil' | 'gastronomia'>('todas')
  const clave = parametrosBorradorTekit(borrador).toString()
  const [intento, setIntento] = useState<{ clave: string; errores: string[] } | null>(null)
  const [aviso, setAviso] = useState<{ clave: string; mensaje: string; error: boolean } | null>(null)
  const [compartido, setCompartido] = useState<{ clave: string; respuesta: AvisoCompartir } | null>(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const resultado = borrador.generado ? calcularPlanTekit(borrador) : null
  const plan = resultado?.plan ?? null
  const vigente = plan ? { ...borrador, seleccion: plan.seleccion } : borrador
  const c = borrador.configuracion
  const errores = resultado?.errores ?? (intento?.clave === clave ? intento.errores : [])
  const urlActual = urlBorradorTekit('itinerario', vigente)
  const cuenta = `${usuario?.idUsuario ?? 'visitante'}:${clave}`
  const avisoActual = aviso?.clave === cuenta ? aviso : null
  const compartirActual = compartido?.clave === clave ? compartido.respuesta : null
  const personalizar = urlBorradorTekit('personalizar', { ...vigente, modo: 'personalizado', generado: false })
  function generar(e: FormEvent) {
    e.preventDefault()
    const r = calcularPlanTekit(borrador)
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
    try { setCompartido({ clave, respuesta: await compartirTekit(new URL(urlActual, window.location.origin).href) }) }
    finally { setCompartiendo(false) }
  }
  function descargar() {
    if (!plan) return
    try {
      descargarTekit(vigente, plan)
      setAviso({ clave: cuenta, error: false, mensaje: 'Se solicitó la descarga del plan en texto.' })
    } catch { setAviso({ clave: cuenta, error: true, mensaje: 'No se pudo descargar el plan. Revisa si el navegador permite descargar archivos.' }) }
  }
  return <article className="tk-plan" aria-labelledby="tk-itinerario-titulo">
    <header className="tk-cabecera">
      <Link className="tk-icono-boton" to={urlBorradorTekit('detalle', vigente)} aria-label="Volver a detalle de ruta"><Icono nombre="arrow_back" tamano={20} /></Link>
      <div className="tk-titulo"><p className="tk-ceja">BIIN Escapadas</p><h1 id="tk-itinerario-titulo">Tu Itinerario en Tekit</h1></div>
      <div className="tk-utilidades"><button type="button" className="tk-icono-boton" disabled={!plan || cargando} onClick={guardar} aria-label="Guardar itinerario"><Icono nombre="bookmark_border" tamano={20} /></button><button type="button" className="tk-icono-boton" disabled={!plan || compartiendo} onClick={compartir} aria-label="Compartir"><Icono nombre="share" tamano={20} /></button></div>
    </header>
    <div className="tk-contenido">
      <p className="tk-resumen-chip"><Icono nombre="styler" tamano={16} />Ruta Textil y Artesanal · {plan ? `${duracionPlan(plan.totalMinutos)} estimadas` : 'Configura tu visita'}</p>
      <p className="tk-modalidad">{esModalidadTekit(c.estancia) ? modalidadesTekit[c.estancia].nombre : 'Modalidad sin validar'} · Plan estimado</p>
      <ModosTekit borrador={vigente} />
      <form className="tk-formulario" noValidate onSubmit={generar}><ConfiguracionTekit borrador={borrador} onChange={actualizar} /><button type="submit" className="tk-primario">Generar itinerario {borrador.modo === 'personalizado' ? 'personalizado' : 'recomendado'}<Icono nombre="arrow_forward" tamano={18} /></button></form>
      <p className="tk-nota">Vista previa demostrativa sin fecha de validación. Visitas y desplazamientos son supuestos del prototipo, no mediciones geográficas. Precios, aperturas, visitas guiadas y transporte sin confirmar.</p>
      {errores.length > 0 && <div className="tk-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
      {!borrador.generado && <p className="tk-vacio" role="status">Aún no hay un plan vigente. Si cambiaste configuración o selección, genera de nuevo.</p>}
      {plan && <>
        <section className="tk-conexion tk-tarjeta" aria-labelledby="tk-conexion-titulo">
          <header><h2 id="tk-conexion-titulo">Conexión Van BIIN</h2><span>Ruta Mérida · Tekit</span><Icono nombre="directions_bus" tamano={20} /></header>
          <div className="tk-conexion-tramo">
            <div><p className="tk-ceja">Inicio elegido · <strong>{horaLocal(c, 0)}</strong></p><p>Tekit Centro, frente a la Parroquia de San Antonio. Referencia del prototipo; llegada sin confirmar.</p></div>
            <p className="tk-tiempo-chip"><Icono nombre="schedule" tamano={15} />{duracionPlan(Number(c.minutosDisponibles))} disponibles · {plan.libresMinutos} min libres</p>
            <div><p className="tk-ceja">Hora objetivo de regreso · <strong>{horaLocal(c, Number(c.minutosDisponibles))}</strong></p><p>Objetivo del usuario. Confirma paradero y transporte con la terminal.</p></div>
          </div>
          <p className="tk-nota">Visitas {plan.visitasMinutos} min + desplazamientos {plan.trasladosMinutos} min (incluye regreso) + margen {plan.margenMinutos} min = {plan.totalMinutos} min.</p>
        </section>
        <div className="tk-filtros" role="group" aria-label="Filtrar recorrido">{([['todas', 'Ruta Sugerida'], ['textil', 'Ruta Textil & Talleres'], ['gastronomia', 'Gastronomía']] as const).map(([id, nombre]) => <button type="button" key={id} aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nombre}</button>)}</div>
        <section className="tk-recorrido" aria-labelledby="tk-pasos-titulo">
          <div className="tk-seccion-titulo"><h2 id="tk-pasos-titulo"><Icono nombre="footprint" tamano={18} />Paso a paso a pie</h2><span>{plan.seleccion.length} lugares</span></div>
          <ol className="tk-visitas" aria-label="Visitas de Tekit">
            {plan.bloques.filter(b => b.tipo === 'visita').map((bloque, indice) => {
              const lugar = lugaresTekit.find(l => l.id === bloque.lugarId)!
              if (filtro !== 'todas' && lugar.categoria !== filtro) return null
              const traslado = plan.bloques.find(b => b.tipo === 'traslado' && b.lugarId === lugar.id)!
              return <li key={lugar.id} value={indice + 1}><article className="tk-paso tk-tarjeta">
                <div className="tk-paso-hora"><span className="tk-horario"><time dateTime={instanteLocal(c, bloque.inicio).toISOString()}>{horaLocal(c, bloque.inicio)}</time> – <time dateTime={instanteLocal(c, bloque.fin).toISOString()}>{horaLocal(c, bloque.fin)}</time></span><span className="tk-caminata"><Icono nombre="directions_walk" tamano={14} />{lugar.trasladoMinutos} min estimados</span></div>
                <h3>{lugar.nombre}</h3><p>{lugar.descripcion}</p>
                <p className="tk-nota">Traslado previo: {horaLocal(c, traslado.inicio)} – {horaLocal(c, traslado.fin)}</p>
                <div className="tk-metadatos"><span className="tk-etiqueta"><Icono nombre={lugar.icono} tamano={13} />{lugar.etiqueta}</span><span className="tk-etiqueta">Visita estimada: {lugar.visitaMinutos} min</span></div>
              </article></li>
            })}
          </ol>
          {filtro !== 'todas' && !plan.seleccion.some(id => lugaresTekit.some(l => l.id === id && l.categoria === filtro)) && <p role="status">No hay visitas de esta categoría. El filtro solo cambia las tarjetas visibles; conserva el plan y sus horarios.</p>}
          <div className="tk-cierre"><Icono nombre="directions_bus" tamano={22} /><div><h3>Cierre de Ruta</h3>{plan.bloques.slice(-2).map(b => <p key={b.titulo}>{horaLocal(c, b.inicio)} – {horaLocal(c, b.fin)} · {b.titulo}: {b.fin - b.inicio} min.</p>)}<p>Tiempo libre: {plan.libresMinutos} min · {horaLocal(c, plan.totalMinutos)} – {horaLocal(c, Number(c.minutosDisponibles))}. El regreso mostrado es tu objetivo, no una salida confirmada.</p></div></div>
        </section>
        <section className="tk-circuito tk-tarjeta" aria-labelledby="tk-circuito-titulo">
          <div className="tk-seccion-titulo"><h2 id="tk-circuito-titulo"><Icono nombre="explore" tamano={18} />Circuito Artesanal Tekit</h2><Link to={urlBorradorTekit('detalle', vigente)}>Ver detalle de ruta<Icono nombre="open_in_new" tamano={14} /></Link></div>
          <div className="tk-circuito-ilustrado"><ol aria-label="Orden ilustrativo del circuito">{plan.seleccion.map((id, i) => { const l = lugaresTekit.find(l => l.id === id)!; return <li key={id}><span><Icono nombre={l.icono} tamano={20} /></span><small>{i + 1}. {l.etiqueta}</small></li> })}</ol><p>{plan.seleccion.length} paradas · Esquema ilustrativo sin escala ni ubicación GPS</p></div>
        </section>
        <section className="tk-consejos" aria-labelledby="tk-consejos-titulo"><h2 id="tk-consejos-titulo"><Icono nombre="tips_and_updates" tamano={18} />Consejos de viaje BIIN</h2><div><Icono nombre="straighten" tamano={16} /><p><strong>Medidas para prendas</strong><span>Conoce tus tallas de hombro y pecho y consulta si ofrecen ajustes.</span></p></div><div><Icono nombre="payments" tamano={16} /><p><strong>Prepara tus compras</strong><span>Confirma precios, medios de pago y condiciones con cada taller.</span></p></div></section>
      </>}
      <div className="tk-resumen-final">
        {!usuario && <p>Puedes preparar una vista previa sin sesión. Para guardar, inicia sesión; recuperarás este borrador.</p>}
        {avisoActual && <p className={avisoActual.error ? 'tk-error' : ''} role={avisoActual.error ? 'alert' : 'status'}>{avisoActual.mensaje}</p>}
        {compartirActual && <p role="status">{compartirActual.mensaje}</p>}
        {plan && compartirActual?.estado === 'manual' && <label>Enlace de la vista previa<input type="url" readOnly value={new URL(urlActual, window.location.origin).href} onFocus={e => e.target.select()} /></label>}
        <button type="button" className="tk-guardar" disabled={!plan || cargando} onClick={guardar}><Icono nombre="bookmark_border" tamano={18} />Guardar en Mi viaje</button>
        <div className="tk-acciones"><button type="button" disabled={!plan} onClick={descargar}><Icono nombre="download_for_offline" tamano={18} />Descargar plan</button><Link to={personalizar}><Icono nombre="tune" tamano={18} />Personalizar</Link></div>
        <p>La descarga contiene texto legible; no incluye mapas offline. Guardado local, sin sincronización con el servidor.</p>
        {usuario && <Link to="/mi-viaje">Ver mis itinerarios guardados</Link>}
      </div>
    </div>
  </article>
}
