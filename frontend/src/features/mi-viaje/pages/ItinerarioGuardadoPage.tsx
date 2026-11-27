import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { useConsultaApi } from '../../../hooks/useConsultaApi'
import EstadoConsulta from '../../../components/ui/EstadoConsulta'
import { idPositivo } from '../../../utils/consultaApi'
import MapaRecorrido from '../../../maps/MapaRecorrido'
import { itinerariosApi, type ItinerarioDetalleDto } from '../api'
import { useOperacionItinerarioApi } from '../hooks/useOperacionItinerarioApi'
import FormularioPlanApi from '../components/FormularioPlanApi'
import ActividadEditableApi from '../components/ActividadEditableApi'
import AgregarActividadApi from '../components/AgregarActividadApi'
import { datosCrearPlan, validarPlanApi } from '../plan/planApi'
import { fechaHora } from '../../../utils/formatoDatos'
import '../../../styles/planificador.css'

/** RF09: detalle y edición de cualquier itinerario de la cuenta actual. */
export default function ItinerarioGuardadoPage() {
  const { idItinerario = '' } = useParams()
  const { usuario } = useAuth()
  if (!usuario) return null
  return <CargarItinerario key={`${usuario.idUsuario}:${idItinerario}`} referencia={idItinerario} idUsuario={usuario.idUsuario} />
}
function CargarItinerario({ referencia, idUsuario }: { referencia: string; idUsuario: number }) {
  const id = idPositivo(referencia)
  const consulta = useConsultaApi(`guardado:${idUsuario}:${referencia}`, signal => {
    if (id === null) throw new Error('El identificador del itinerario no es válido.')
    return itinerariosApi.obtener(id, signal)
  })
  return <section className="iz-plan iz-itinerario"><Link to="/mi-viaje">← Mis itinerarios</Link><EstadoConsulta consulta={consulta} />{consulta.datos && <EditarItinerario inicial={consulta.datos} recargar={consulta.reintentar} />}</section>
}
function EditarItinerario({ inicial, recargar }: { inicial: ItinerarioDetalleDto; recargar: () => void }) {
  const [itinerario, setItinerario] = useState(inicial)
  const [config, setConfig] = useState({ nombre: inicial.nombre, inicio: inicial.inicio, fin: inicial.fin, presupuesto: inicial.presupuestoEstimado?.toString() ?? '', horaInicio: '09:00' })
  const [errores, setErrores] = useState<string[]>([])
  const [quitar, setQuitar] = useState<number | null>(null)
  const operacion = useOperacionItinerarioApi(setItinerario)
  const actividades = [...itinerario.actividades].sort((a, b) => a.orden - b.orden)
  const id = itinerario.idItinerario
  function guardar(e: FormEvent) {
    e.preventDefault(); const mensajes = validarPlanApi(config); setErrores(mensajes)
    if (!mensajes.length) void operacion.ejecutar(() => itinerariosApi.actualizar(id, datosCrearPlan(config)))
  }
  function mover(indice: number, paso: number) {
    const ids = actividades.map(a => a.idActividad); [ids[indice], ids[indice + paso]] = [ids[indice + paso], ids[indice]]
    void operacion.ejecutar(() => itinerariosApi.reordenarActividades(id, { idActividades: ids }))
  }
  return <>
    <header className="iz-plan-cabecera"><div><p className="iz-plan-ceja">Guardado en tu cuenta</p><h1>{itinerario.nombre}</h1></div></header><p>{itinerario.inicio} → {itinerario.fin}</p><p className="iz-plan-nota">Creado: {fechaHora(itinerario.fechaCreacion)} · Horarios de Yucatán.</p>
    <form onSubmit={guardar} noValidate><FormularioPlanApi config={config} cambiar={setConfig} personalizado disabled={operacion.ocupado} /><button type="submit" className="iz-plan-primario" disabled={operacion.ocupado}>Guardar datos del viaje</button></form>
    {!!errores.length && <div role="alert">{errores.map(e => <p key={e}>{e}</p>)}</div>}
    {operacion.error && <div role="alert" className="iz-plan-error"><p>{operacion.error}</p>{operacion.incierto && <button type="button" onClick={recargar}>Recargar itinerario</button>}</div>}
    {operacion.ocupado && !operacion.incierto && <p role="status">Guardando cambio…</p>}
    {!!itinerario.advertencias.length && <section className="iz-plan-tarjeta" aria-labelledby="advertencias-plan"><h2 id="advertencias-plan">Avisos del itinerario</h2><ul>{itinerario.advertencias.map((a, i) => <li key={`${a.tipo}:${i}`}>{a.mensaje}</li>)}</ul></section>}
    <h2>Actividades del itinerario</h2>{!actividades.length && <p role="status">Este itinerario aún no tiene actividades.</p>}
    <ol className="iz-plan-linea">{actividades.map((a, i) => <li key={a.idActividad}><span className="iz-plan-orden">{i + 1}</span><article className="iz-plan-paso iz-plan-tarjeta"><h3>{a.titulo}</h3><p>{a.localidad} · {a.tipo}</p>{!a.disponible && <p role="status">Este contenido ya no está disponible.</p>}
      {a.trasladoDesdeAnterior && <p>Traslado estimado: {a.trasladoDesdeAnterior.minutosEstimados} min · {a.trasladoDesdeAnterior.distanciaKm.toFixed(1)} km. Confirma el transporte.</p>}
      <ActividadEditableApi key={`${a.idActividad}:${a.inicioPrevisto}:${a.finPrevisto}:${a.notas}`} actividad={a} disabled={operacion.ocupado} guardar={datos => void operacion.ejecutar(() => itinerariosApi.actualizarActividad(id, a.idActividad, datos))} />
      <div className="iz-plan-acciones"><button type="button" aria-label={`Subir ${a.titulo}`} disabled={operacion.ocupado || i === 0} onClick={() => mover(i, -1)}>↑ Subir</button><button type="button" aria-label={`Bajar ${a.titulo}`} disabled={operacion.ocupado || i === actividades.length - 1} onClick={() => mover(i, 1)}>↓ Bajar</button><button type="button" disabled={operacion.ocupado} onClick={() => setQuitar(a.idActividad)}>Quitar actividad</button></div>
      {quitar === a.idActividad && <div role="group" aria-label={`Confirmar quitar ${a.titulo}`}><p>¿Quitar {a.titulo} de este itinerario?</p><button type="button" disabled={operacion.ocupado} onClick={() => setQuitar(null)}>Cancelar</button><button type="button" disabled={operacion.ocupado} onClick={() => { void operacion.ejecutar(() => itinerariosApi.quitarActividad(id, a.idActividad)); setQuitar(null) }}>Confirmar quitar</button></div>}
    </article></li>)}</ol>
    <AgregarActividadApi disabled={operacion.ocupado || actividades.length >= 50} usados={actividades.map(a => a.idRecurso)} agregar={idRecurso => void operacion.ejecutar(() => itinerariosApi.agregarActividad(id, { idRecurso }))} />
    <section className="iz-plan-tarjeta"><h2>Ubicaciones del itinerario</h2><MapaRecorrido paradas={actividades.flatMap(a => a.latitud !== null && a.longitud !== null ? [{ latitud: a.latitud, longitud: a.longitud, nombre: a.titulo }] : [])} /></section>
    <button type="button" disabled={operacion.ocupado} onClick={() => {
      const archivo = new Blob([JSON.stringify(itinerario, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(archivo); const enlace = document.createElement('a'); enlace.href = url; enlace.download = `BIIN-itinerario-${id}.json`; enlace.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }}>Descargar itinerario</button><p className="iz-plan-nota">La descarga conserva las fechas de creación y las advertencias de esta consulta. Los horarios y el cupo pueden cambiar.</p>
  </>
}
