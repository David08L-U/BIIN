import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { useConsultaApi } from '../../../hooks/useConsultaApi'
import EstadoConsulta from '../../../components/ui/EstadoConsulta'
import { itinerariosApi } from '../../mi-viaje/api'
import { useOperacionItinerarioApi } from '../../mi-viaje/hooks/useOperacionItinerarioApi'

export default function AgregarContenidoApi({ idRecurso }: { idRecurso: number }) {
  const { usuario } = useAuth()
  const location = useLocation()
  if (!usuario) return <Link to="/login" state={{ desde: location.pathname + location.search }}>Iniciar sesión para agregar a un itinerario</Link>
  return <AgregarCuenta key={`${usuario.idUsuario}:${idRecurso}`} idUsuario={usuario.idUsuario} idRecurso={idRecurso} />
}
function AgregarCuenta({ idUsuario, idRecurso }: { idUsuario: number; idRecurso: number }) {
  const consulta = useConsultaApi(`agregar-contenido:${idUsuario}`, signal => itinerariosApi.listar(signal))
  const [id, setId] = useState('')
  const navegar = useNavigate()
  const vivo = useRef(true)
  useEffect(() => { vivo.current = true; return () => { vivo.current = false } }, [])
  const operacion = useOperacionItinerarioApi(resultado => { if (vivo.current) navegar(`/mi-viaje/${resultado.idItinerario}`) })
  function enviar(e: FormEvent) {
    e.preventDefault()
    if (!consulta.datos?.some(i => String(i.idItinerario) === id)) return
    void operacion.ejecutar(() => itinerariosApi.agregarActividad(Number(id), { idRecurso }))
  }
  return <section className="formulario-api"><h2>Agregar a un itinerario</h2><EstadoConsulta consulta={consulta} />
    {consulta.datos?.length === 0 && <p>No tienes itinerarios en tu cuenta. <Link to="/recorridos">Preparar un itinerario</Link></p>}
    {!!consulta.datos?.length && <form onSubmit={enviar}><label>Itinerario<select required disabled={operacion.ocupado} value={id} onChange={e => setId(e.target.value)}><option value="">Elige tu viaje</option>{consulta.datos.map(i => <option value={i.idItinerario} key={i.idItinerario}>{i.nombre} · {i.inicio}</option>)}</select></label><button type="submit" disabled={operacion.ocupado || !id}>Agregar actividad al viaje</button></form>}
    {operacion.error && <p role="alert">{operacion.error} {operacion.incierto && <Link to={`/mi-viaje/${id}`}>Revisar itinerario</Link>}</p>}
  </section>
}
