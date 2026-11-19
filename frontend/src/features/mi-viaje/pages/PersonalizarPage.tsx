import { useState } from 'react'
import { Link,useNavigate,useParams,useSearchParams } from 'react-router'
import { actividades,buscarDestino } from '../../../services/catalogo'
import type { Interes,Plan } from '../../../types/catalogo'
import CabeceraPagina from '../../../components/ui/CabeceraPagina'
import EstadoVacio from '../../../components/ui/EstadoVacio'
import TarjetaActividad from '../../exploracion/components/TarjetaActividad'
import Icono from '../../../components/ui/Icono'
import { tiempoTotal,validarPlan } from '../planificador'
import { usePlanes } from '../usePlanes'
import { duracion,fechaLocal } from '../../../utils/formato'
export default function PersonalizarPage(){
 const {id}=useParams(),[params]=useSearchParams(),d=buscarDestino(id),{planes,guardar,error:fallo}=usePlanes(),navegar=useNavigate()
 const existente=planes.find(p=>p.id===params.get('plan')&&p.destinoId===id)
 const [seleccion,setSeleccion]=useState<string[]>(existente?.actividades??[]),[fecha,setFecha]=useState(existente?.fecha??fechaLocal()),[inicio,setInicio]=useState(existente?.inicio??d?.llegada??'10:00'),[limite,setLimite]=useState(existente?.limite??([180,270,480].includes(Number(params.get('duracion')))?Number(params.get('duracion')):270)),[error,setError]=useState('')
 if(!d)return <section className="pagina"><EstadoVacio titulo="Destino no disponible"><Link to="/rutas">Elegir destino</Link></EstadoVacio></section>
 const disponibles=actividades.filter(a=>a.destinoId===id),elegidas=seleccion.map(s=>disponibles.find(a=>a.id===s)).filter(a=>a!==undefined),total=tiempoTotal(elegidas),margen=limite-total
 function cambiar(a:string){setSeleccion(prev=>prev.includes(a)?prev.filter(s=>s!==a):[...prev,a]);setError('')}
 function generar(){
  const mensaje=validarPlan(elegidas,inicio,limite,fecha);if(mensaje){setError(mensaje);return}
  const p:Plan={id:existente?.id??crypto.randomUUID(),destinoId:d!.id,fecha,inicio,limite,actividades:seleccion,actualizadoEn:new Date().toISOString()}
  if(guardar(p))navegar(`/itinerario/${d!.id}?plan=${p.id}`)
 }
 return <section className="pagina personalizar-page"><CabeceraPagina titulo="Personalizar itinerario" subtitulo={`${d.nombre} · A TU RITMO`} volver={`/rutas/${d.id}`}/><div className="personalizar-grid"><aside className="resumen-personalizar"><div className="tarjeta bloque-tiempo"><span className="badge badge-ambar"><Icono nombre="bus"/>Van BIIN · Mérida — {d.nombre}</span><p>Elige tus paradas para armar una visita dentro de tu tiempo disponible.</p><div className="campo"><label htmlFor="fecha-visita">Fecha de visita</label><input id="fecha-visita" type="date" min={fechaLocal()} value={fecha} onChange={e=>setFecha(e.target.value)}/></div><div className="campo"><label htmlFor="hora-visita">Inicio de la visita</label><input id="hora-visita" type="time" value={inicio} onChange={e=>setInicio(e.target.value)}/></div><div className="campo"><label htmlFor="duracion-visita">Tiempo disponible</label><select id="duracion-visita" value={limite} onChange={e=>setLimite(Number(e.target.value))}><option value={180}>Visita breve · 3 horas</option><option value={270}>Medio día · 4 h 30 min</option><option value={480}>Día completo · 8 horas</option></select></div><div className="fila"><span>Tiempo acumulado</span><strong>{duracion(total)} / {duracion(limite)}</strong></div><progress value={Math.min(total,limite)} max={limite} aria-label="Tiempo de actividades seleccionado"/><p className={margen<30?'mensaje-error':'texto-ambar'} role="status">{margen<30?'Tu selección supera el margen seguro.':`Margen libre: ${duracion(margen)} · Incluye 30 min para el paradero.`}</p><small>Horarios estimados. Confirma aperturas y regreso con cada establecimiento y operador.</small></div></aside><div>{(['Gastronomía','Talleres','Cultura','Cenotes'] as Interes[]).map(categoria=>{const lista=disponibles.filter(a=>a.categoria===categoria);return lista.length>0&&<section className="grupo-actividades" key={categoria}><div className="fila"><h2>{categoria==='Gastronomía'?'¿Dónde comer?':categoria==='Talleres'?'Talleres y cultura viva':categoria==='Cultura'?'Monumentos y arqueología':'Cenotes y naturaleza'}</h2><span className="badge">{lista.filter(a=>seleccion.includes(a.id)).length} seleccionadas</span></div>{lista.map(a=><TarjetaActividad key={a.id} actividad={a} seleccionada={seleccion.includes(a.id)} cambiar={cambiar}/>)}</section>})}</div></div><div className="acciones-plan"><div className="fila"><strong>{seleccion.length} lugares seleccionados</strong><span>{duracion(total)} estimadas</span></div>{(error||fallo)&&<p className="mensaje-error" role="alert">{error||fallo}</p>}<button className="boton boton--primario" onClick={generar}><Icono nombre="guardar"/>Generar y guardar mi itinerario</button><button className="enlace" onClick={()=>{setSeleccion([]);setError('')}}>Restablecer selección</button><small>Borrador guardado únicamente en este dispositivo.</small></div></section>
}
