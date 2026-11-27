import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { useConsultaApi } from '../../../hooks/useConsultaApi'
import EstadoConsulta from '../../../components/ui/EstadoConsulta'
import { itinerariosApi, type ItinerarioResumenDto } from '../api'
import { fechaHora, moneda } from '../../../utils/formatoDatos'
import '../../../styles/planificador.css'

export default function MiViajePage() {
  const { usuario } = useAuth()
  if (!usuario) return null
  return <MisViajes key={usuario.idUsuario} idUsuario={usuario.idUsuario} nombre={usuario.nombre} />
}
function MisViajes({ idUsuario, nombre }: { idUsuario: number; nombre: string }) {
  const consulta = useConsultaApi(`mis-viajes:${idUsuario}`, signal => itinerariosApi.listar(signal))
  return <section className="plan plan-mis-viajes"><h1>Mis itinerarios</h1><p>Guardados en la cuenta de {nombre}.</p><EstadoConsulta consulta={consulta} />
    {consulta.datos?.length === 0 && <p role="status">Todavía no tienes itinerarios guardados en tu cuenta.</p>}
    <ul className="lista-viajes-api">{consulta.datos?.map(item => <li key={item.idItinerario} className="plan-tarjeta"><h2>{item.nombre}</h2><p>{item.inicio} → {item.fin} · {item.totalActividades} actividades</p><p>Presupuesto: {moneda(item.presupuestoEstimado)}</p><p>Creado: {fechaHora(item.fechaCreacion)}</p><Link to={`/mi-viaje/${item.idItinerario}`}>Abrir y editar itinerario</Link><EliminarItinerario item={item} actualizar={consulta.reintentar} /></li>)}</ul>
    <Link className="plan-primario" to="/recorridos">Preparar otro itinerario</Link><p className="plan-nota">Los planes antiguos guardados únicamente en este navegador no se han eliminado. Esta lista muestra los itinerarios del servidor.</p>
  </section>
}
function EliminarItinerario({ item, actualizar }: { item: ItinerarioResumenDto; actualizar: () => void }) {
  const [confirmar, setConfirmar] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [incierto, setIncierto] = useState(false)
  const bloqueo = useRef(false)
  async function eliminar() {
    if (bloqueo.current) return
    bloqueo.current = true; setOcupado(true); setError('')
    try { await itinerariosApi.eliminar(item.idItinerario); actualizar() }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo eliminar.'); setIncierto(true) }
    finally { bloqueo.current = false; setOcupado(false) }
  }
  return <div><button type="button" onClick={() => setConfirmar(true)}>Eliminar itinerario</button>{confirmar && <div role="group" aria-label={`Eliminar ${item.nombre}`}><p>¿Eliminar el itinerario «{item.nombre}» de tu cuenta?</p><button type="button" disabled={ocupado} onClick={() => setConfirmar(false)}>Cancelar</button><button type="button" disabled={ocupado || incierto} onClick={() => void eliminar()}>{ocupado ? 'Eliminando…' : 'Confirmar eliminación'}</button></div>}{error && <p role="alert">{error} <button type="button" onClick={actualizar}>Recargar lista</button></p>}</div>
}
