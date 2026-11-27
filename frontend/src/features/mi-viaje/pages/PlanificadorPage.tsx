import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import EstadoConsulta from '../../../components/ui/EstadoConsulta'
import MapaRecorrido from '../../../maps/MapaRecorrido'
import { fechaHora } from '../../../utils/formatoDatos'
import { useAuth } from '../../auth/useAuth'
import type { RecorridoDetalle } from '../../recorridos/types'
import { useContextoPlanApi } from '../hooks/useContextoPlanApi'
import { useGuardarPlanApi } from '../hooks/useGuardarPlanApi'
import { configuracionInicial, parametrosPlanApi, validarPlanApi } from '../plan/planApi'
import FormularioPlanApi from '../components/FormularioPlanApi'
import EtapasRecorridoApi from '../components/EtapasRecorridoApi'
import ModosPlan from '../components/ModosPlan'
import { duracionPlan } from '../plan/duracion'
import '../../../styles/planificador.css'

/** Una misma pantalla de itinerario/personalización para cualquier destino de la API. RF09 / CU-13. */
export default function PlanificadorPage({ modo }: { modo: 'recomendado' | 'personalizado' }) {
  const { id, idRecorrido } = useParams()
  const [params, setParams] = useSearchParams()
  const { usuario } = useAuth()
  const consulta = useContextoPlanApi(id, idRecorrido, params.get('recorrido'))
  const contexto = consulta.datos
  if (!contexto?.recorrido) return <section className="iz-plan"><h1>Planifica tu visita</h1><EstadoConsulta consulta={consulta} />{contexto && <p role="status">No hay recorridos publicados para este destino.</p>}<Link to="/rutas">Volver al catálogo de rutas</Link></section>
  const base = contexto.ruta ? `/rutas/${contexto.ruta.idRuta}` : `/recorridos/${contexto.recorrido.idRecorrido}`
  return <>
    {contexto.opciones.length > 1 && <label className="selector-recorrido">Recorrido sugerido<select value={contexto.recorrido.idRecorrido} onChange={e => { const nuevos = new URLSearchParams(params); nuevos.set('recorrido', e.target.value); nuevos.delete('seleccion'); setParams(nuevos, { replace: true }) }}>{contexto.opciones.map(r => <option key={r.idRecorrido} value={r.idRecorrido}>{r.titulo}</option>)}</select></label>}
    <PlanificadorContenido key={`${base}:${contexto.recorrido.idRecorrido}:${modo}:${usuario?.idUsuario ?? 'visitante'}`} recorrido={contexto.recorrido} base={base} modo={modo} />
  </>
}

function PlanificadorContenido({ recorrido, base, modo }: { recorrido: RecorridoDetalle; base: string; modo: 'recomendado' | 'personalizado' }) {
  const [params, setParams] = useSearchParams()
  const [config, setConfig] = useState(() => configuracionInicial(params, recorrido.titulo))
  const disponibles = [...recorrido.etapas].sort((a, b) => a.orden - b.orden).filter(e => e.disponible).map(e => e.orden)
  const [seleccion, setSeleccion] = useState<number[]>(() => params.has('seleccion') ? [...new Set((params.get('seleccion') ?? '').split(',').map(Number))].filter(id => disponibles.includes(id)) : disponibles)
  const [errores, setErrores] = useState<string[]>([])
  const personalizado = modo === 'personalizado'
  const { usuario, cargando } = useAuth()
  const navegar = useNavigate()
  const location = useLocation()
  const guardado = useGuardarPlanApi()
  const elegidas = personalizado ? seleccion : disponibles
  const bloqueado = guardado.guardando || guardado.parcial !== null || guardado.incierto
  const etapas = elegidas.map(orden => recorrido.etapas.find(e => e.orden === orden)!)
  function sincronizar(siguiente = config, ids = seleccion) {
    const nuevos = parametrosPlanApi(siguiente, ids, true)
    if (params.has('recorrido')) nuevos.set('recorrido', String(recorrido.idRecorrido))
    setParams(nuevos, { replace: true })
  }
  async function guardar(e: FormEvent) {
    e.preventDefault()
    const mensajes = validarPlanApi(config)
    if (!elegidas.length) mensajes.push('Elige al menos una actividad disponible.')
    if (elegidas.length > 50) mensajes.push('Un itinerario puede tener como máximo 50 actividades.')
    setErrores(mensajes)
    if (mensajes.length || bloqueado || cargando) return
    if (!usuario) { navegar('/login', { state: { desde: `${location.pathname}${location.search}` } }); return }
    const resultado = await guardado.guardar(recorrido, config, elegidas, personalizado)
    if (resultado) navegar(`/mi-viaje/${resultado.idItinerario}`, { replace: true })
  }
  const query = params.toString() ? `?${params}` : ''
  return <article className="iz-plan iz-itinerario" aria-labelledby="plan-titulo">
    <header className="iz-plan-cabecera"><Link to={base.startsWith('/rutas/') ? base : '/recorridos'} aria-label="Volver al destino">← Volver</Link><div className="iz-plan-titulo"><p className="iz-plan-ceja">{recorrido.localidadBase}</p><h1 id="plan-titulo">{personalizado ? 'Personalizar itinerario' : 'Tu itinerario recomendado'}</h1></div></header>
    <ModosPlan modo={modo} recomendado={`${base}/itinerario${query}`} personalizado={`${base}/personalizar${query}`} />
    <h2>{recorrido.titulo}</h2><p>{recorrido.descripcion}</p><p className="iz-plan-nota">Información publicada · Actualizada: {fechaHora(recorrido.actualizadoEn)}</p>
    <form onSubmit={e => void guardar(e)} noValidate>
      <FormularioPlanApi config={config} personalizado={personalizado} disabled={bloqueado} cambiar={c => { setConfig(c); setErrores([]); sincronizar(c) }} />
      <EtapasRecorridoApi etapas={recorrido.etapas} seleccion={seleccion} personalizado={personalizado} disabled={bloqueado} cambiar={ids => { setSeleccion(ids); setErrores([]); sincronizar(config, ids) }} />
      <section className="iz-plan-tarjeta"><h2>Resumen de tu visita</h2><p>{elegidas.length} actividades seleccionadas</p><p>{duracionPlan(etapas.reduce((total, etapa) => total + (etapa.duracionSugeridaMin ?? 0), 0))} de visitas con duración publicada; no incluye traslados.</p>{etapas.some(etapa => etapa.duracionSugeridaMin === null) && <p>Hay actividades con duración sin confirmar.</p>}<p>{personalizado ? 'Podrás editar los horarios después de guardar.' : 'Al guardar, el servidor asignará horarios y traslados estimados. Una actividad sin duración publicada usará la estimación de 60 minutos del planificador.'} Confirma aperturas, transporte y costos antes de viajar.</p></section>
      {!!errores.length && <div role="alert" className="iz-plan-error">{errores.map(error => <p key={error}>{error}</p>)}</div>}
      {guardado.error && <p role="alert" className="iz-plan-error">{guardado.error}</p>}
      {guardado.parcial !== null && <Link to={`/mi-viaje/${guardado.parcial}`}>Abrir itinerario parcialmente guardado</Link>}
      {!usuario && <p>Para guardar en tu cuenta, inicia sesión. Conservaremos la configuración de esta visita.</p>}
      <button type="submit" className="iz-plan-primario" disabled={bloqueado || cargando || !elegidas.length}>{guardado.guardando ? 'Guardando…' : usuario ? 'Guardar itinerario en mi cuenta' : 'Iniciar sesión para guardar'}</button>
    </form>
    <section className="iz-plan-mapa iz-plan-tarjeta"><h2>Ubicaciones de la visita</h2><MapaRecorrido paradas={etapas.flatMap(e => e.latitud !== null && e.longitud !== null ? [{ latitud: e.latitud, longitud: e.longitud, nombre: e.titulo }] : [])} /></section>
    <Link to="/mi-viaje">Ver mis itinerarios</Link>
  </article>
}
