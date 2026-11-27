import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { obtenerDestino } from '../../destinos/registroDestinos'
import type { DestinoId } from '../../destinos/contratos'
import RutaNoEncontrada from '../../transporte/components/RutaNoEncontrada'
import { useGuardarItinerarioServidor } from '../hooks/useGuardarItinerarioServidor'
import { usePlanificador } from '../hooks/usePlanificador'
import { compartirPlan, type AvisoCompartir } from '../plan/accionesPlan'
import { duracionPlan } from '../plan/duracion'
import { planificadores } from '../plan/registroPlanificadores'
import CabeceraPlan from '../components/CabeceraPlan'
import ConsejosItinerario from '../components/ConsejosItinerario'
import EnlaceDetalleRuta from '../components/EnlaceDetalleRuta'
import FiltrosPlan from '../components/FiltrosPlan'
import Icono from '../components/IconoItinerario'
import ModosPlan from '../components/ModosPlan'
import PresentacionJornadas from '../components/PresentacionJornadas'
import RecorridoPlan, { ConexionPlan } from '../components/RecorridoPlan'

export default function ItinerarioPage() {
  const destino = obtenerDestino(useParams().id)
  return destino ? <Itinerario key={destino.id} destino={destino.id} /> : <RutaNoEncontrada />
}

function Itinerario({ destino }: { destino: DestinoId }) {
  const adaptador = planificadores[destino]
  const { datos } = adaptador
  const sesion = usePlanificador(adaptador, 'itinerario')
  const { borrador, plan, errores, clave, actualizar, historico } = sesion
  const { usuario, cargando } = useAuth()
  const { guardar: guardarEnServidor, guardando } = useGuardarItinerarioServidor()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const contextoGuardado = useRef<symbol | null>(null)
  useLayoutEffect(() => {
    contextoGuardado.current = Symbol()
    return () => { contextoGuardado.current = null }
  }, [ubicacion.key, usuario?.idUsuario])
  const [filtro, setFiltro] = useState('todas')
  const [aviso, setAviso] = useState<{ clave: string; mensaje: string; error: boolean } | null>(null)
  const [enlace, setEnlace] = useState<{ clave: string; respuesta: AvisoCompartir } | null>(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const cuenta = `${usuario?.idUsuario ?? 'visitante'}:${clave}`
  const avisoActual = aviso?.clave === cuenta ? aviso : null
  const compartirActual = enlace?.clave === cuenta ? enlace.respuesta : null
  const [dia] = plan?.jornadas ?? []
  const variasJornadas = (plan?.jornadas.length ?? 0) > 1
  const estancia = datos.estancia(borrador.configuracion.estancia)
  const titulo = `Tu Itinerario en ${datos.nombre}`
  const duracionEstimada = plan ? `${duracionPlan(plan.jornadas.reduce((total, jornada) => total + jornada.totalMinutos, 0))} estimadas` : 'Configura tu visita'
  const puedeGuardar = Boolean(plan) && !historico && !cargando && !guardando

  async function guardar() {
    if (!plan || !puedeGuardar) return
    if (!usuario) {
      navegar('/login', { state: { desde: plan.url } })
      return
    }
    if (borrador.editarId && !window.confirm(`¿Guardar cambios en el itinerario de ${datos.nombre} del ${borrador.configuracion.fecha || 'fecha sin confirmar'}?`)) return
    const inicioGuardado = contextoGuardado.current
    const respuesta = await guardarEnServidor(plan.vigente)
    if (contextoGuardado.current !== inicioGuardado) return
    if (!respuesta.itinerario) {
      setAviso({ clave: cuenta, error: true, mensaje: respuesta.error ?? 'No se pudo confirmar el guardado en el servidor.' })
      return
    }
    const parametros = plan.guardado(respuesta.itinerario.id)
    actualizar(parametros)
    setAviso({ clave: `${usuario.idUsuario}:${parametros}`, error: false, mensaje: borrador.editarId ? 'Cambios guardados en tu cuenta' : 'Itinerario guardado en tu cuenta' })
  }

  async function compartir() {
    if (!plan || compartiendo) return
    if (datos.enlaceManual) {
      setEnlace(compartirActual ? null : { clave: cuenta, respuesta: { estado: 'manual', mensaje: '' } })
      return
    }
    setCompartiendo(true)
    try {
      setEnlace({ clave: cuenta, respuesta: await compartirPlan(new URL(plan.url, window.location.origin).href, titulo) })
    } finally {
      setCompartiendo(false)
    }
  }

  function descargar() {
    if (!plan) return
    try {
      plan.descargar()
      setAviso({ clave: cuenta, error: false, mensaje: 'Se solicitó la descarga del plan en texto.' })
    } catch {
      setAviso({ clave: cuenta, error: true, mensaje: 'No se pudo descargar el plan. Revisa si el navegador permite descargar archivos.' })
    }
  }

  return <article className="iz-plan iz-itinerario" data-estancia={borrador.configuracion.estancia} aria-labelledby="itinerario-titulo">
    <CabeceraPlan id="itinerario-titulo" titulo={titulo} subtitulo="BIIN Escapadas" volver={sesion.urlDetalle} acciones={<>
      <button type="button" className="iz-plan-icono-boton" disabled={!puedeGuardar} onClick={guardar} aria-busy={guardando} aria-label={guardando ? 'Guardando itinerario' : borrador.editarId ? 'Guardar cambios' : 'Guardar itinerario'}><Icono nombre="bookmark" tamano={20} /></button>
      <button type="button" className="iz-plan-icono-boton" disabled={!plan || compartiendo} onClick={compartir} aria-label={datos.enlaceManual ? 'Mostrar enlace del plan' : datos.etiquetaCompartir ?? 'Compartir'}><Icono nombre="share" tamano={20} /></button>
    </>} />
    <div className="iz-plan-contenido">
      <div className="iz-plan-estancia"><span><Icono nombre={datos.icono} tamano={16} />{datos.tituloEstancia ? `${datos.tituloEstancia} · ${duracionEstimada}` : estancia}</span><span className="iz-plan-insignia">Plan estimado</span></div>
      {datos.tituloEstancia && <p className="iz-plan-nota">{estancia}</p>}
      <ModosPlan modo={borrador.modo} recomendado={sesion.recomendado} personalizado={plan?.editar ?? sesion.personalizar} />
      <form className="iz-plan-formulario" noValidate onSubmit={sesion.generar}>
        {sesion.configuracion(actualizar)}
        <button type="submit" className="iz-plan-primario">Generar itinerario {borrador.modo === 'personalizado' ? 'personalizado' : 'recomendado'}<Icono nombre="arrow_forward" tamano={18} /></button>
      </form>
      <p className="iz-plan-nota">{datos.nota}</p>
      {historico && <p className="iz-plan-nota" role="status">Vista de un itinerario con fecha pasada. Puedes consultarlo y descargarlo.</p>}
      {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
      {!borrador.generado && <p className="iz-plan-vacio" role="status">Aún no hay un plan vigente. Si cambiaste configuración o selección, genera de nuevo.</p>}
      {plan && dia && <>
        {!variasJornadas && <ConexionPlan datos={datos} dia={dia} />}
        <FiltrosPlan etiqueta="Filtrar recorrido" opciones={[{ id: 'todas', nombre: 'Ruta Sugerida' }, ...datos.filtros]} activo={filtro} seleccionar={setFiltro} />
        {variasJornadas
          ? <PresentacionJornadas destino={destino} jornadas={plan.jornadas} lugares={datos.lugares} filtro={filtro} categoriaDeLugar={datos.categoriaRecorrido} />
          : <RecorridoPlan destino={destino} datos={datos} dia={dia} filtro={filtro} />}
        <EnlaceDetalleRuta to={sesion.urlDetalle} />
        <ConsejosItinerario id="consejos-plan-titulo" consejos={datos.consejos} />
      </>}
      <div className="iz-plan-resumen-final">
        {!usuario && <p>Puedes preparar una vista previa sin sesión. Para guardar, inicia sesión y recupera tu borrador.</p>}
        {avisoActual && <p className={avisoActual.error ? 'iz-plan-error' : ''} role={avisoActual.error ? 'alert' : 'status'}>{avisoActual.mensaje}</p>}
        {compartirActual?.mensaje && <p role="status">{compartirActual.mensaje}</p>}
        {plan && compartirActual?.estado === 'manual' && <label>{datos.enlaceManual ? 'Enlace del plan' : 'Enlace de la vista previa'}<input type="url" readOnly value={new URL(plan.url, window.location.origin).href} onFocus={evento => evento.target.select()} /></label>}
        <div className="iz-plan-acciones iz-plan-acciones-completas">
          <button type="button" className="iz-plan-guardar" disabled={!puedeGuardar} onClick={guardar}><Icono nombre="bookmark_border" tamano={18} />{datos.guardar}</button>
          <button type="button" disabled={!plan} onClick={descargar}><Icono nombre="download_for_offline" tamano={18} />Descargar plan</button>
          <Link to={plan?.editar ?? sesion.personalizar}><Icono nombre="tune" tamano={18} />Personalizar</Link>
        </div>
        {usuario && <Link to="/mi-viaje">Ver mis itinerarios guardados</Link>}
      </div>
    </div>
  </article>
}
