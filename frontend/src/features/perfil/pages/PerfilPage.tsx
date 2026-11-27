import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { useConsultaApi } from '../../../hooks/useConsultaApi'
import { itinerariosApi } from '../../mi-viaje/api'
import PerfilVista from '../components/PerfilVista'

export default function PerfilPage() {
  const { usuario, cerrarSesion } = useAuth()
  const navegar = useNavigate()
  if (!usuario) return null
  return <PerfilCuenta key={usuario.idUsuario} idUsuario={usuario.idUsuario} nombre={usuario.nombre} correo={usuario.correo} cerrar={() => { cerrarSesion(); navegar('/login', { replace: true }) }} />
}
function PerfilCuenta({ idUsuario, nombre, correo, cerrar }: { idUsuario: number; nombre: string; correo: string; cerrar: () => void }) {
  const consulta = useConsultaApi(`perfil-viajes:${idUsuario}`, signal => itinerariosApi.listar(signal))
  const recientes = [...(consulta.datos ?? [])].sort((a, b) => Date.parse(b.fechaCreacion) - Date.parse(a.fechaCreacion)).slice(0, 2)
  return <><PerfilVista datos={{ nombre, correo, periodo: new Date().toLocaleDateString('es-MX', { month: 'long' }), movilidad: [null, null, null], cargandoItinerarios: consulta.cargando, errorItinerarios: consulta.error,
    itinerarios: recientes.map(i => ({ id: String(i.idItinerario), nombre: i.nombre, paradas: i.totalActividades, url: `/mi-viaje/${i.idItinerario}`, icono: 'navigation', guardadoEn: i.fechaCreacion })) }} onCerrarSesion={cerrar} />{consulta.error && <button type="button" onClick={consulta.reintentar}>Reintentar itinerarios</button>}</>
}
