import FiltrosPlan from '../components/FiltrosPlan'
import CabeceraPlan from '../components/CabeceraPlan'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import ConfiguracionTicul from '../components/ConfiguracionTicul'
import ModosTicul from '../components/ModosTicul'
import ImagenItinerario from '../components/ImagenItinerario'
import Icono from '../components/IconoItinerario'
import { avisoTrasladoComidaTicul, lugaresTicul, mapaTicul, nombreTrasladoTicul } from '../data/lugaresTicul'
import { useBorradorTicul } from '../hooks/useBorradorTicul'
import { parametrosBorradorTicul, urlBorradorTicul } from '../plan/borradorTicul'
import { calcularPlanTicul, esModalidadTicul, modalidadesTicul } from '../plan/itinerarioTicul'
import { duracionPlan } from '../plan/duracion'
import { horaLocal, instanteLocal } from '../plan/tiempoLocal'
import { compartirTicul, descargarTicul } from '../plan/accionesTicul'
import type { AvisoCompartir } from '../plan/accionesPlan'
import { guardarItinerarioLocal } from '../storage/itinerariosLocales'

export default function ItinerarioTiculPage() {
  const { borrador, actualizar } = useBorradorTicul()
  const { usuario, cargando } = useAuth()
  const navegar = useNavigate()
  const [filtro, setFiltro] = useState<'todas' | 'artesanias' | 'gastronomia'>('todas')
  const clave = parametrosBorradorTicul(borrador).toString()
  const [intento, setIntento] = useState<{ clave: string; errores: string[] } | null>(null)
  const [aviso, setAviso] = useState<{ clave: string; error: boolean; mensaje: string } | null>(null)
  const [compartido, setCompartido] = useState<{ clave: string; respuesta: AvisoCompartir } | null>(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const resultado = borrador.generado ? calcularPlanTicul(borrador) : null
  const plan = resultado?.plan ?? null
  const vigente = plan ? { ...borrador, seleccion: plan.seleccion } : borrador
  const c = borrador.configuracion
  const errores = resultado?.errores ?? (intento?.clave === clave ? intento.errores : [])
  const urlActual = urlBorradorTicul('itinerario', vigente)
  const cuenta = `${usuario?.idUsuario ?? 'visitante'}:${clave}`
  const avisoActual = aviso?.clave === cuenta ? aviso : null
  const compartirActual = compartido?.clave === clave ? compartido.respuesta : null
  const personalizar = urlBorradorTicul('personalizar', { ...vigente, modo: 'personalizado', generado: false })
  function generar(e: FormEvent) {
    e.preventDefault()
    const r = calcularPlanTicul(borrador)
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
    try { setCompartido({ clave, respuesta: await compartirTicul(new URL(urlActual, window.location.origin).href) }) }
    finally { setCompartiendo(false) }
  }
  function descargar() {
    if (!plan) return
    try { descargarTicul(vigente, plan); setAviso({ clave: cuenta, error: false, mensaje: 'Se solicitó la descarga del plan en texto.' }) }
    catch { setAviso({ clave: cuenta, error: true, mensaje: 'No se pudo descargar el plan. Revisa si el navegador permite descargar archivos.' }) }
  }
  return <article className="iz-plan iz-itinerario" aria-labelledby="ti-itinerario-titulo">
    <CabeceraPlan id="ti-itinerario-titulo" titulo="Tu Itinerario en Ticul" subtitulo="BIIN Escapadas" volver={urlBorradorTicul('detalle', vigente)} acciones={<>
          <button type="button" className="iz-plan-icono-boton" disabled={!plan || cargando} onClick={guardar} aria-label="Guardar itinerario"><Icono nombre="bookmark" tamano={20} /></button>
          <button type="button" className="iz-plan-icono-boton" disabled={!plan || compartiendo} onClick={compartir} aria-label="Compartir itinerario"><Icono nombre="share" tamano={20} /></button>

        </>} />
    <div className="iz-plan-contenido">
      <div className="iz-plan-estancia"><span><Icono nombre="palette" tamano={16} />Alfarería y Calzado Tradicional · {plan ? `${duracionPlan(plan.totalMinutos)} estimadas` : 'Configura tu visita'}</span><span className="iz-plan-insignia">Plan estimado</span></div>
      <p className="iz-plan-nota">{esModalidadTicul(c.estancia) ? modalidadesTicul[c.estancia].nombre : 'Modalidad sin validar'}</p>
      <ModosTicul borrador={vigente} />
      <form className="iz-plan-formulario" noValidate onSubmit={generar}><ConfiguracionTicul borrador={borrador} onChange={actualizar} /><button type="submit" className="iz-plan-primario">Generar itinerario {borrador.modo === 'personalizado' ? 'personalizado' : 'recomendado'}<Icono nombre="arrow_forward" tamano={18} /></button></form>
      <p className="iz-plan-nota">Datos e imágenes demostrativos, sin fecha de validación. Tiempos estimados; precios, aperturas y acceso sin confirmar. Mototaxi sin disponibilidad confirmada, no contratado. {avisoTrasladoComidaTicul}</p>
      {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
      {!borrador.generado && <p className="iz-plan-vacio" role="status">Aún no hay un plan vigente. Si cambiaste configuración o selección, genera de nuevo.</p>}
      {plan && <>
        <section className="iz-plan-conexion iz-plan-tarjeta" aria-labelledby="ti-conexion-titulo">
          <header className="iz-plan-conexion-titulo"><h2 id="ti-conexion-titulo">Conexión Van BIIN</h2><span>Ruta Mérida · Ticul</span><Icono nombre="directions_bus" tamano={20} /></header>
          <div className="iz-plan-conexion-fila"><span className="iz-plan-punto" aria-hidden="true" /><div><p className="iz-plan-ceja">Inicio elegido · {horaLocal(c, 0)}</p><strong>Ticul Centro (Frente al Mercado Municipal)</strong><p>Referencia de inicio; llegada del transporte sin confirmar.</p></div></div>
          <p className="iz-plan-conexion-margen"><Icono nombre="schedule" tamano={16} />{duracionPlan(Number(c.minutosDisponibles))} disponibles · {duracionPlan(plan.libresMinutos)} libres</p>
          <div className="iz-plan-conexion-fila"><span className="iz-plan-punto" aria-hidden="true" /><div><p className="iz-plan-ceja">Hora objetivo de regreso · {horaLocal(c, Number(c.minutosDisponibles))}</p><strong>Referencia del paradero en Ticul</strong><p>Objetivo del usuario; no es una salida confirmada. Consulta paradero y transporte con la terminal.</p></div></div>
          <p className="iz-plan-nota">Visitas {duracionPlan(plan.visitasMinutos)} + traslados {duracionPlan(plan.trasladosMinutos)} (incluye regreso) + margen {duracionPlan(plan.margenMinutos)} = {duracionPlan(plan.totalMinutos)}.</p>
        </section>
        <FiltrosPlan etiqueta="Filtrar recorrido" opciones={[
            { id: 'todas', nombre: 'Ruta Sugerida' },
            { id: 'artesanias', nombre: 'Alfarería & Zapaterías' },
            { id: 'gastronomia', nombre: 'Gastronomía' },
          ]} activo={filtro} seleccionar={setFiltro} />
        <section className="iz-plan-recorrido" aria-labelledby="ti-pasos-titulo">
          <div className="iz-plan-categoria-titulo"><h2 id="ti-pasos-titulo">Paso a paso a pie &amp; mototaxi</h2><span>{plan.seleccion.length} lugares</span></div>
          <ol className="iz-plan-linea" aria-label="Recorrido de Ticul">
            {plan.bloques.filter(b => b.tipo === 'visita').map((bloque, i) => {
              const l = lugaresTicul.find(l => l.id === bloque.lugarId)!
              if (filtro !== 'todas' && l.categoria !== filtro) return null
              const traslado = plan.bloques.find(b => b.tipo === 'traslado' && b.lugarId === l.id)!
              return <li key={l.id} value={i + 1}><span className="iz-plan-orden" aria-hidden="true">{i + 1}</span><article className="iz-plan-paso iz-plan-tarjeta">
                <div className="iz-plan-paso-hora"><span><time dateTime={instanteLocal(c, bloque.inicio).toISOString()}>{horaLocal(c, bloque.inicio)}</time> – <time dateTime={instanteLocal(c, bloque.fin).toISOString()}>{horaLocal(c, bloque.fin)}</time></span><span className="iz-plan-insignia">{l.etiqueta}</span></div>
                <p className="iz-plan-caminata"><Icono nombre={l.traslado.icono} tamano={15} />{nombreTrasladoTicul(l)} · {horaLocal(c, traslado.inicio)} – {horaLocal(c, traslado.fin)}</p>
                <h3>{l.nombre}</h3><p>{l.descripcion}</p><ImagenItinerario {...l.imagen} className="iz-plan-imagen" /><p className="iz-plan-duracion">Visita estimada: {duracionPlan(l.visitaMinutos)}</p>
              </article></li>
            })}
            <li><span className="iz-plan-orden iz-plan-orden-cierre" aria-hidden="true"><Icono nombre="check" tamano={10} /></span><div className="iz-plan-cierre iz-plan-tarjeta"><h3>Cierre del recorrido</h3>{plan.bloques.slice(-2).map(b => <p key={b.titulo}>{horaLocal(c, b.inicio)} – {horaLocal(c, b.fin)} · {b.titulo}: {duracionPlan(b.fin - b.inicio)}.</p>)}<p>Tiempo libre: {duracionPlan(plan.libresMinutos)} · {horaLocal(c, plan.totalMinutos)} – {horaLocal(c, Number(c.minutosDisponibles))}. El regreso mostrado es tu objetivo, no una salida confirmada.</p></div></li>
          </ol>
          {filtro !== 'todas' && !plan.seleccion.some(id => lugaresTicul.some(l => l.id === id && l.categoria === filtro)) && <p role="status">No hay visitas de esta categoría. El filtro conserva el plan y sus horarios.</p>}
        </section>
        <section className="iz-plan-mapa iz-plan-tarjeta" aria-labelledby="ti-mapa-titulo"><div className="iz-plan-categoria-titulo"><h2 id="ti-mapa-titulo"><Icono nombre="map" tamano={20} />Circuito Artesanal Ticul</h2><Link to={urlBorradorTicul('detalle', vigente)}>Ver detalle de ruta<Icono nombre="open_in_new" tamano={16} /></Link></div><ImagenItinerario {...mapaTicul} className="iz-plan-imagen" /><p className="iz-plan-nota">Mapa ilustrativo; no acredita un circuito geográfico ni una distancia verificada.</p></section>
        <section className="iz-plan-consejos iz-plan-tarjeta" aria-labelledby="ti-consejos-titulo"><h2 id="ti-consejos-titulo"><Icono nombre="lightbulb" tamano={20} />Consejos de viaje BIIN</h2><div><h3><Icono nombre="inventory_2" tamano={16} />Empaque para cerámica</h3><p>Consulta si ofrecen empaque y cuáles son las condiciones para transportar piezas delicadas en la van.</p></div><div><h3><Icono nombre="handshake" tamano={16} />Regateo justo</h3><p>Valora el trabajo artesanal y consulta precios y condiciones directamente en cada taller.</p></div></section>
      </>}
      <div className="iz-plan-resumen-final">
        {!usuario && <p>Puedes preparar una vista previa sin sesión. Para guardar, inicia sesión; recuperarás este borrador.</p>}
        {avisoActual && <p className={avisoActual.error ? 'iz-plan-error' : ''} role={avisoActual.error ? 'alert' : 'status'}>{avisoActual.mensaje}</p>}
        {compartirActual && <p role="status">{compartirActual.mensaje}</p>}
        {plan && compartirActual?.estado === 'manual' && <label>Enlace de la vista previa<input type="url" readOnly value={new URL(urlActual, window.location.origin).href} onFocus={e => e.target.select()} /></label>}
        <div className="iz-plan-acciones iz-plan-acciones-completas"><button type="button" className="iz-plan-guardar" disabled={!plan || cargando} onClick={guardar}><Icono nombre="bookmark_border" tamano={18} />Guardar en Mi viaje</button><button type="button" disabled={!plan} onClick={descargar}><Icono nombre="download_for_offline" tamano={18} />Descargar plan</button><Link to={personalizar}><Icono nombre="tune" tamano={18} />Personalizar</Link></div>
        <p>Descarga en texto, sin mapas offline. Guardado local, sin sincronización con el servidor.</p>
        {usuario && <Link to="/mi-viaje">Ver mis itinerarios guardados</Link>}
      </div>
    </div>
  </article>
}
