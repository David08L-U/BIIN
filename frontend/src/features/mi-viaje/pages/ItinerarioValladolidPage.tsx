import FiltrosPlan from '../components/FiltrosPlan'
import ModosPlan from '../components/ModosPlan'
import CabeceraPlan from '../components/CabeceraPlan'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import ConsejosItinerario from '../components/ConsejosItinerario'
import EnlaceDetalleRuta from '../components/EnlaceDetalleRuta'
import ConfiguracionValladolid from '../components/ConfiguracionValladolid'
import Icono from '../components/IconoItinerario'
import ImagenItinerario from '../components/ImagenItinerario'
import { fotografiaLugar } from '../../explorar/data/lugaresExplorar'
import { lugaresValladolid } from '../data/lugaresValladolid'
import { useBorradorValladolid } from '../hooks/useBorradorValladolid'
import { parametrosBorradorValladolid, urlBorradorValladolid } from '../plan/borradorValladolid'
import { calcularPlanValladolid, esEstanciaValladolid, estanciasValladolid } from '../plan/itinerarioValladolid'
import type { JornadaValladolid } from '../plan/itinerarioValladolid'
import { horaLocal, instanteLocal } from '../plan/tiempoLocal'
import { duracionPlan } from '../plan/duracion'
import { compartirValladolid, descargarValladolid } from '../plan/accionesValladolid'
import type { AvisoCompartir } from '../plan/accionesValladolid'
import { useGuardarItinerarioServidor } from '../hooks/useGuardarItinerarioServidor'

function Conexion({ dia }: { dia: JornadaValladolid }) {
  return <section className="iz-plan-conexion iz-plan-tarjeta" aria-label={`Conexión BIIN del Día ${dia.dia}`}>
    <header><h2><Icono nombre="directions_bus" tamano={18} />Conexión BIIN</h2><span>Ruta Mérida · Valladolid</span></header>
    <div className="iz-plan-conexion-contenido">
      <p className="iz-plan-ceja">Día {dia.dia} · {dia.fecha}</p>
      <div className="iz-plan-conexion-fila"><span><Icono nombre="pin_drop" tamano={16} /></span><div><p className="iz-plan-ceja">Inicio elegido · {horaLocal(dia, 0)}</p><strong>Valladolid Centro</strong><p>Frente al Parque Principal Francisco Cantón. Punto de referencia ilustrativo; llegada del transporte sin confirmar.</p></div></div>
      <div className="iz-plan-conexion-margen"><span><Icono nombre="directions_walk" tamano={16} />Tiempo para la visita</span><strong>{duracionPlan(Number(dia.minutosDisponibles))}</strong></div>
      <div className="iz-plan-conexion-fila"><span ><Icono nombre="sync_alt" tamano={16} /></span><div><p className="iz-plan-ceja">Hora objetivo de regreso · {horaLocal(dia, Number(dia.minutosDisponibles))}</p><strong>Referencia de regreso de referencia</strong><p>Objetivo del usuario; no es una salida confirmada. Confirma punto y transporte con la terminal.</p></div></div>
      <p className="iz-plan-nota">Visitas {duracionPlan(dia.visitasMinutos)} + traslados {duracionPlan(dia.trasladosMinutos)} (incluye traslado final) + margen {duracionPlan(dia.margenMinutos)} = {duracionPlan(dia.totalMinutos)}. Libres: {duracionPlan(dia.libresMinutos)}.</p>
    </div>
  </section>
}

export default function ItinerarioValladolidPage() {
  const { borrador, actualizar } = useBorradorValladolid()
  const { usuario, cargando } = useAuth()
  const { guardar: guardarEnServidor, guardando } = useGuardarItinerarioServidor()
  const navegar = useNavigate()
  const [filtro, setFiltro] = useState<'todas' | 'cultural-cenotes' | 'gastronomia'>('todas')
  const clave = parametrosBorradorValladolid(borrador).toString()
  const [intento, setIntento] = useState<{ clave: string; errores: string[] } | null>(null)
  const [aviso, setAviso] = useState<{ clave: string; mensaje: string; error: boolean } | null>(null)
  const [compartido, setCompartido] = useState<{ clave: string; respuesta: AvisoCompartir } | null>(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const resultado = borrador.generado ? calcularPlanValladolid(borrador) : null
  const plan = resultado?.plan ?? null
  const borradorVigente = plan ? { ...borrador, seleccion: plan.seleccion } : borrador
  const errores = resultado?.errores ?? (intento?.clave === clave ? intento.errores : [])
  const urlActual = urlBorradorValladolid('itinerario', borradorVigente)
  const claveCuenta = `${usuario?.idUsuario ?? 'visitante'}:${clave}`
  const avisoActual = aviso?.clave === claveCuenta ? aviso : null
  const compartirActual = compartido?.clave === clave ? compartido.respuesta : null
  const personalizar = urlBorradorValladolid('personalizar', { ...borrador, seleccion: plan?.seleccion ?? borrador.seleccion, modo: 'personalizado', generado: false })
  const nombreEstancia = esEstanciaValladolid(borrador.configuracion.estancia) ? estanciasValladolid[borrador.configuracion.estancia].nombre : 'Estancia sin validar'

  function generar(evento: FormEvent) {
    evento.preventDefault()
    const calculo = calcularPlanValladolid(borrador)
    setIntento({ clave, errores: calculo.errores })
    if (calculo.plan) actualizar({ generado: true, seleccion: calculo.plan.seleccion })
  }
  async function guardar() {
    if (!plan || cargando || guardando) return
    if (!usuario) { navegar('/login', { state: { desde: urlActual } }); return }
    if (borrador.editarId && !window.confirm(`¿Guardar cambios en el itinerario de Valladolid del ${borrador.configuracion.fecha || 'fecha sin confirmar'}?`)) return
    const respuesta = await guardarEnServidor({ ...borradorVigente, generado: true })
    if (!respuesta.itinerario) {
      setAviso({ clave: claveCuenta, error: true, mensaje: respuesta.error ?? 'No se pudo confirmar el guardado en el servidor.' })
      return
    }
    const actualizado = { ...borradorVigente, generado: true, editarId: respuesta.itinerario.id }
    actualizar({ editarId: respuesta.itinerario.id, generado: true })
    setAviso({ clave: `${usuario.idUsuario}:${parametrosBorradorValladolid(actualizado)}`, error: false, mensaje: borrador.editarId ? 'Cambios guardados en tu cuenta' : 'Itinerario guardado en tu cuenta' })
  }
  async function compartir() {
    if (!plan || compartiendo) return
    setCompartiendo(true)
    try { setCompartido({ clave, respuesta: await compartirValladolid(new URL(urlActual, window.location.origin).href) }) }
    finally { setCompartiendo(false) }
  }
  function descargar() {
    if (!plan) return
    try {
      descargarValladolid(borradorVigente, plan)
      setAviso({ clave: claveCuenta, error: false, mensaje: 'Se solicitó la descarga del plan. El archivo no incluye mapas offline.' })
    } catch { setAviso({ clave: claveCuenta, error: true, mensaje: 'No se pudo descargar el plan. Inténtalo de nuevo desde un navegador que permita descargar archivos.' }) }
  }

  return <article className="iz-plan iz-itinerario" aria-labelledby="va-itinerario-titulo">
    <CabeceraPlan id="va-itinerario-titulo" titulo="Tu Itinerario en Valladolid" subtitulo="BIIN Escapadas" volver={urlBorradorValladolid('detalle', borradorVigente)} acciones={<>
          <button type="button" className="iz-plan-icono-boton" disabled={!plan || cargando || guardando} onClick={guardar} aria-busy={guardando} aria-label={guardando ? 'Guardando itinerario' : borrador.editarId ? 'Guardar cambios' : 'Guardar itinerario'}><Icono nombre="bookmark" tamano={20} /></button>
          <button type="button" className="iz-plan-icono-boton" disabled={!plan || compartiendo} onClick={compartir} aria-label="Compartir"><Icono nombre="share" tamano={20} /></button>

        </>} />
    <div className="iz-plan-contenido">
      <div className="iz-plan-estancia"><span><Icono nombre="schedule" tamano={16} />{nombreEstancia} en la Sultana del Oriente</span><span className="iz-plan-insignia">Plan estimado</span></div>
      <ModosPlan modo={borrador.modo} recomendado={urlBorradorValladolid('itinerario', { ...borrador, modo: 'recomendado', generado: false })} personalizado={personalizar} />
      <form className="iz-plan-formulario" noValidate onSubmit={generar}><ConfiguracionValladolid borrador={borrador} onChange={nuevo => actualizar(nuevo)} /><button type="submit" className="iz-plan-primario">Generar itinerario {borrador.modo === 'personalizado' ? 'personalizado' : 'recomendado'}<Icono nombre="arrow_forward" tamano={18} /></button></form>
      <p className="iz-plan-nota">Información demostrativa. Tarifas, aperturas y transporte por confirmar; recorrido no optimizado geográficamente.</p>
      {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
      {!borrador.generado && <p className="iz-plan-vacio" role="status">Aún no hay un plan vigente. Si cambiaste configuración o selección, genera de nuevo.</p>}
      {plan && <>
        {plan.jornadas.map(dia => <Conexion dia={dia} key={dia.dia} />)}
        <FiltrosPlan etiqueta="Filtrar recorrido" opciones={[
            { id: 'todas', nombre: 'Ruta Sugerida' },
            { id: 'cultural-cenotes', nombre: 'Cultural & Cenotes' },
            { id: 'gastronomia', nombre: 'Gastronomía' },
          ]} activo={filtro} seleccionar={setFiltro} />
        <section className="iz-plan-recorrido" aria-labelledby="va-pasos-titulo">
          <div className="iz-plan-categoria-titulo"><h2 id="va-pasos-titulo">Paso a paso a pie</h2><span>{plan.seleccion.length} lugares</span></div>
          {plan.jornadas.map(dia => {
            const visitas = dia.bloques.filter(b => b.tipo === 'visita')
            const visibles = visitas.filter(b => { const lugar = lugaresValladolid.find(l => l.id === b.lugarId)!; return filtro === 'todas' || (filtro === 'gastronomia' ? lugar.categoria === 'gastronomia' : lugar.categoria !== 'gastronomia') })
            return <section className="iz-plan-jornada" key={dia.dia} aria-labelledby={`va-dia-${dia.dia}`}>
              <h3 id={`va-dia-${dia.dia}`}>Día {dia.dia} · <time dateTime={dia.fecha}>{dia.fecha}</time></h3>
              <ol className="iz-plan-linea" aria-label={`Recorrido del Día ${dia.dia}`}>
                {visitas.map((bloque, indice) => {
                  if (!visibles.includes(bloque)) return null
                  const lugar = lugaresValladolid.find(l => l.id === bloque.lugarId)!
                  const imagen = fotografiaLugar('valladolid', lugar.id)
                  const traslado = dia.bloques.find(b => b.tipo === 'traslado' && b.lugarId === lugar.id)!
                  return <li key={lugar.id} value={indice + 1}><span className="iz-plan-orden" aria-hidden="true">{indice + 1}</span><article className="iz-plan-paso iz-plan-tarjeta">
                    <div className="iz-plan-paso-hora"><span><time dateTime={instanteLocal(dia, bloque.inicio).toISOString()}>{horaLocal(dia, bloque.inicio)}</time> – <time dateTime={instanteLocal(dia, bloque.fin).toISOString()}>{horaLocal(dia, bloque.fin)}</time></span><span>{lugar.etiqueta}</span></div>
                    <p className="iz-plan-caminata"><Icono nombre="directions_walk" tamano={14} />Traslado estimado: {duracionPlan(traslado.fin - traslado.inicio)} · {horaLocal(dia, traslado.inicio)} – {horaLocal(dia, traslado.fin)}</p>
                    <h4>{lugar.nombre}</h4><p>{lugar.descripcion}</p>
                    <ImagenItinerario src={imagen?.src} alt={imagen?.alt ?? `Fotografía de ${lugar.nombre} pendiente de verificar`} credito={imagen?.credito} fuente={imagen?.fuente} className="iz-plan-imagen" />
                    <p className="iz-plan-duracion">Visita estimada: {duracionPlan(lugar.visitaMinutos)}</p>
                  </article></li>
                })}
                <li><span className="iz-plan-orden iz-plan-orden-cierre" aria-hidden="true"><Icono nombre="flag" tamano={18} /></span><div className="iz-plan-cierre iz-plan-tarjeta"><p className="iz-plan-ceja">Cierre del recorrido · Día {dia.dia}</p><h4>Regreso al punto de referencia</h4>{dia.bloques.slice(-2).map(b => <p key={b.titulo}>{horaLocal(dia, b.inicio)} – {horaLocal(dia, b.fin)} · {b.titulo}: {duracionPlan(b.fin - b.inicio)}.</p>)}<p>Quedan {duracionPlan(dia.libresMinutos)} libres. Hora objetivo: {horaLocal(dia, Number(dia.minutosDisponibles))}; no es una salida confirmada.</p></div></li>
              </ol>
              {!visibles.length && <p role="status">No hay visitas de esta categoría en el Día {dia.dia}. El filtro solo cambia las tarjetas visibles, no el plan ni sus horarios.</p>}
            </section>
          })}
        </section>
        <EnlaceDetalleRuta to={urlBorradorValladolid('detalle', borrador)} />
        <ConsejosItinerario id="va-consejos-titulo" consejos={[{ icono: 'footprint', titulo: 'Calzado cómodo', descripcion: 'Camina sobre adoquín colonial y aceras de piedra.' }, { icono: 'pool', titulo: 'Traje de baño y toalla', descripcion: 'Consulta las condiciones y aperturas antes de visitar el Cenote Zací.' }]} />
      </>}
      <div className="iz-plan-resumen-final">
        {!usuario && <p>Puedes preparar una vista previa sin sesión. Para guardar, inicia sesión; conservarás este borrador.</p>}
        {avisoActual && <p className={avisoActual.error ? 'iz-plan-error' : ''} role={avisoActual.error ? 'alert' : 'status'}>{avisoActual.mensaje}</p>}
        {compartirActual && <p role="status">{compartirActual.mensaje}</p>}
        {plan && compartirActual?.estado === 'manual' && <label>Enlace de la vista previa<input type="url" readOnly value={new URL(urlActual, window.location.origin).href} onFocus={e => e.target.select()} /></label>}
        <div className="iz-plan-acciones iz-plan-acciones-completas"><button type="button" className="iz-plan-guardar" disabled={!plan || cargando} onClick={guardar}><Icono nombre="bookmark_border" tamano={18} />Guardar en este navegador</button><button type="button" disabled={!plan} onClick={descargar}><Icono nombre="cloud_download" tamano={18} />Descargar plan</button><Link to={personalizar}><Icono nombre="tune" tamano={18} />Personalizar</Link></div>
        <p>La descarga contiene el itinerario en texto; no incluye mapas offline.</p>
        {usuario && <Link to="/mi-viaje">Ver mis itinerarios guardados</Link>}
      </div>
    </div>
  </article>
}
