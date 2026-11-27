import FiltrosPlan from '../components/FiltrosPlan'
import CabeceraPlan from '../components/CabeceraPlan'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import ConfiguracionTekit from '../components/ConfiguracionTekit'
import ConsejosItinerario from '../components/ConsejosItinerario'
import EnlaceDetalleRuta from '../components/EnlaceDetalleRuta'
import ModosTekit from '../components/ModosTekit'
import Icono from '../components/IconoItinerario'
import { lugaresTekit } from '../data/lugaresTekit'
import { useBorradorTekit } from '../hooks/useBorradorTekit'
import { parametrosBorradorTekit, urlBorradorTekit } from '../plan/borradorTekit'
import { calcularPlanTekit, esModalidadTekit, modalidadesTekit } from '../plan/itinerarioTekit'
import { duracionPlan } from '../plan/duracion'
import { horaLocal, instanteLocal } from '../plan/tiempoLocal'
import { compartirTekit, descargarTekit } from '../plan/accionesTekit'
import type { AvisoCompartir } from '../plan/accionesPlan'
import { useGuardarItinerarioServidor } from '../hooks/useGuardarItinerarioServidor'

export default function ItinerarioTekitPage() {
  const { borrador, actualizar } = useBorradorTekit()
  const { usuario, cargando } = useAuth()
  const { guardar: guardarEnServidor, guardando } = useGuardarItinerarioServidor()
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
  async function guardar() {
    if (!plan || cargando || guardando) return
    if (!usuario) { navegar('/login', { state: { desde: urlActual } }); return }
    if (borrador.editarId && !window.confirm(`¿Guardar cambios en el itinerario de Tekit del ${c.fecha || 'fecha sin confirmar'}?`)) return
    const r = await guardarEnServidor({ ...vigente, generado: true })
    if (!r.itinerario) { setAviso({ clave: cuenta, error: true, mensaje: r.error ?? 'No se pudo confirmar el guardado en el servidor.' }); return }
    const actualizado = { ...vigente, generado: true, editarId: r.itinerario.id }
    actualizar({ editarId: r.itinerario.id, generado: true })
    setAviso({ clave: `${usuario.idUsuario}:${parametrosBorradorTekit(actualizado)}`, error: false, mensaje: borrador.editarId ? 'Cambios guardados en tu cuenta' : 'Itinerario guardado en tu cuenta' })
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
  return <article className="iz-plan iz-itinerario" aria-labelledby="tk-itinerario-titulo">
    <CabeceraPlan id="tk-itinerario-titulo" titulo="Tu Itinerario en Tekit" subtitulo="BIIN Escapadas" volver={urlBorradorTekit('detalle', vigente)} acciones={<>
          <button type="button" className="iz-plan-icono-boton" disabled={!plan || cargando || guardando} onClick={guardar} aria-busy={guardando} aria-label={guardando ? 'Guardando itinerario' : borrador.editarId ? 'Guardar cambios' : 'Guardar itinerario'}><Icono nombre="bookmark" tamano={20} /></button>
          <button type="button" className="iz-plan-icono-boton" disabled={!plan || compartiendo} onClick={compartir} aria-label="Compartir"><Icono nombre="share" tamano={20} /></button>

        </>} />
    <div className="iz-plan-contenido">
      <div className="iz-plan-estancia"><span><Icono nombre="styler" tamano={16} />Ruta Textil y Artesanal · {plan ? `${duracionPlan(plan.totalMinutos)} estimadas` : 'Configura tu visita'}</span><span className="iz-plan-insignia">Plan estimado</span></div>
      <p className="iz-plan-nota">{esModalidadTekit(c.estancia) ? modalidadesTekit[c.estancia].nombre : 'Modalidad sin validar'}</p>
      <ModosTekit borrador={vigente} />
      <form className="iz-plan-formulario" noValidate onSubmit={generar}><ConfiguracionTekit borrador={borrador} onChange={actualizar} /><button type="submit" className="iz-plan-primario">Generar itinerario {borrador.modo === 'personalizado' ? 'personalizado' : 'recomendado'}<Icono nombre="arrow_forward" tamano={18} /></button></form>
      <p className="iz-plan-nota">Información demostrativa; precios, aperturas, visitas guiadas y transporte por confirmar. Traslados estimados, no geográficos.</p>
      {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
      {!borrador.generado && <p className="iz-plan-vacio" role="status">Aún no hay un plan vigente. Si cambiaste configuración o selección, genera de nuevo.</p>}
      {plan && <>
        <section className="iz-plan-conexion iz-plan-tarjeta" aria-labelledby="tk-conexion-titulo">
          <header className="iz-plan-conexion-titulo"><h2 id="tk-conexion-titulo">Conexión Van BIIN</h2><span>Ruta Mérida · Tekit</span><Icono nombre="directions_bus" tamano={20} /></header>
          <div className="iz-plan-conexion-tramo">
            <div><p className="iz-plan-ceja">Inicio elegido · <strong>{horaLocal(c, 0)}</strong></p><p>Tekit Centro, frente a la Parroquia de San Antonio. Punto de referencia ilustrativo; llegada sin confirmar.</p></div>
            <p className="iz-plan-conexion-margen"><Icono nombre="schedule" tamano={15} />{duracionPlan(Number(c.minutosDisponibles))} disponibles · {duracionPlan(plan.libresMinutos)} libres</p>
            <div><p className="iz-plan-ceja">Hora objetivo de regreso · <strong>{horaLocal(c, Number(c.minutosDisponibles))}</strong></p><p>Objetivo del usuario. Confirma paradero y transporte con la terminal.</p></div>
          </div>
          <p className="iz-plan-nota">Visitas {duracionPlan(plan.visitasMinutos)} + desplazamientos {duracionPlan(plan.trasladosMinutos)} (incluye regreso) + margen {duracionPlan(plan.margenMinutos)} = {duracionPlan(plan.totalMinutos)}.</p>
        </section>
        <FiltrosPlan etiqueta="Filtrar recorrido" opciones={[
            { id: 'todas', nombre: 'Ruta Sugerida' },
            { id: 'textil', nombre: 'Ruta Textil & Talleres' },
            { id: 'gastronomia', nombre: 'Gastronomía' },
          ]} activo={filtro} seleccionar={setFiltro} />
        <section className="iz-plan-recorrido" aria-labelledby="tk-pasos-titulo">
          <div className="iz-plan-categoria-titulo"><h2 id="tk-pasos-titulo"><Icono nombre="footprint" tamano={18} />Paso a paso a pie</h2><span>{plan.seleccion.length} lugares</span></div>
          <ol className="iz-plan-linea" aria-label="Visitas de Tekit">
            {plan.bloques.filter(b => b.tipo === 'visita').map((bloque, indice) => {
              const lugar = lugaresTekit.find(l => l.id === bloque.lugarId)!
              if (filtro !== 'todas' && lugar.categoria !== filtro) return null
              const traslado = plan.bloques.find(b => b.tipo === 'traslado' && b.lugarId === lugar.id)!
              return <li key={lugar.id} value={indice + 1}><span className="iz-plan-orden" aria-hidden="true">{indice + 1}</span><article className="iz-plan-paso iz-plan-tarjeta">
                <div className="iz-plan-paso-hora"><span ><time dateTime={instanteLocal(c, bloque.inicio).toISOString()}>{horaLocal(c, bloque.inicio)}</time> – <time dateTime={instanteLocal(c, bloque.fin).toISOString()}>{horaLocal(c, bloque.fin)}</time></span><span className="iz-plan-caminata"><Icono nombre="directions_walk" tamano={14} />{duracionPlan(lugar.trasladoMinutos)} estimados</span></div>
                <h3>{lugar.nombre}</h3><p>{lugar.descripcion}</p>
                <p className="iz-plan-nota">Traslado previo: {horaLocal(c, traslado.inicio)} – {horaLocal(c, traslado.fin)}</p>
                <div className="iz-plan-metadatos"><span className="iz-plan-insignia"><Icono nombre={lugar.icono} tamano={13} />{lugar.etiqueta}</span><span className="iz-plan-insignia">Visita estimada: {duracionPlan(lugar.visitaMinutos)}</span></div>
              </article></li>
            })}
          </ol>
          {filtro !== 'todas' && !plan.seleccion.some(id => lugaresTekit.some(l => l.id === id && l.categoria === filtro)) && <p role="status">No hay visitas de esta categoría. El filtro solo cambia las tarjetas visibles; conserva el plan y sus horarios.</p>}
          <div className="iz-plan-cierre iz-plan-tarjeta"><Icono nombre="directions_bus" tamano={22} /><div><h3>Cierre de Ruta</h3>{plan.bloques.slice(-2).map(b => <p key={b.titulo}>{horaLocal(c, b.inicio)} – {horaLocal(c, b.fin)} · {b.titulo}: {duracionPlan(b.fin - b.inicio)}.</p>)}<p>Tiempo libre: {duracionPlan(plan.libresMinutos)} · {horaLocal(c, plan.totalMinutos)} – {horaLocal(c, Number(c.minutosDisponibles))}. El regreso mostrado es tu objetivo, no una salida confirmada.</p></div></div>
        </section>
        <EnlaceDetalleRuta to={urlBorradorTekit('detalle', vigente)} />
        <ConsejosItinerario id="tk-consejos-titulo" consejos={[{ icono: 'straighten', titulo: 'Medidas para prendas', descripcion: 'Conoce tus tallas de hombro y pecho y consulta si ofrecen ajustes.' }, { icono: 'payments', titulo: 'Prepara tus compras', descripcion: 'Confirma precios, medios de pago y condiciones con cada taller.' }]} />
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
