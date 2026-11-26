import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import type { ItinerarioGuardado } from '../../mi-viaje/storage/itinerariosLocales'
import { itinerariosApi } from '../../mi-viaje/api/itinerariosApi'
import { ApiError } from '../../../services/api'
import { urlBorrador } from '../../mi-viaje/plan/borradorIzamal'
import { urlBorradorValladolid } from '../../mi-viaje/plan/borradorValladolid'
import { urlBorradorTekit } from '../../mi-viaje/plan/borradorTekit'
import { urlBorradorHomun } from '../../mi-viaje/plan/borradorHomun'
import { urlBorradorTicul } from '../../mi-viaje/plan/borradorTicul'
import PerfilVista, { type ItinerarioPerfil } from '../components/PerfilVista'

function resumirItinerario(item: ItinerarioGuardado): ItinerarioPerfil {
  let nombre: string
  let url: string
  if (item.destino === 'valladolid') {
    nombre = 'Valladolid'
    url = urlBorradorValladolid('itinerario', item.borrador)
  } else if (item.destino === 'tekit') {
    nombre = 'Tekit'
    url = urlBorradorTekit('itinerario', item.borrador)
  } else if (item.destino === 'homun') {
    nombre = 'Homún'
    url = urlBorradorHomun('itinerario', item.borrador)
  } else if (item.destino === 'ticul') {
    nombre = 'Ticul'
    url = urlBorradorTicul('itinerario', item.borrador)
  } else {
    nombre = 'Izamal'
    url = urlBorrador('itinerario', item.borrador)
  }
  return {
    id: item.id,
    nombre,
    paradas: item.borrador.seleccion.length,
    url,
    icono: item.destino === 'homun' ? 'pool' : 'navigation',
    guardadoEn: item.guardadoEn,
  }
}

/** CU-01 / CU-09: lectura de la cuenta actual; no escribe datos del perfil. */
export default function PerfilPage() {
  const { usuario, cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const [periodo] = useState(() => new Date().toLocaleDateString('es-MX', { month: 'long' }))
  const idUsuario = usuario?.idUsuario ?? 0
  const [itinerarios, setItinerarios] = useState<ItinerarioGuardado[]>([])
  const [cargandoItinerarios, setCargandoItinerarios] = useState(true)
  const [errorItinerarios, setErrorItinerarios] = useState<string | null>(null)

  useEffect(() => {
    if (!idUsuario) return
    let activa = true
    void itinerariosApi.listar().then(datos => {
      if (activa) { setItinerarios(datos); setErrorItinerarios(null) }
    }).catch(error => {
      if (!activa) return
      if (error instanceof ApiError && error.estado === 401) {
        cerrarSesion()
        navegar('/login', { replace: true, state: { desde: '/perfil' } })
      } else setErrorItinerarios(error instanceof Error ? error.message : 'No se pudieron consultar los itinerarios de la cuenta.')
    }).finally(() => { if (activa) setCargandoItinerarios(false) })
    return () => { activa = false }
  }, [cerrarSesion, navegar, idUsuario])

  if (!usuario) return null

  const recientes = [...itinerarios]
    .sort((a, b) => Date.parse(b.guardadoEn) - Date.parse(a.guardadoEn))
    .slice(0, 2)

  return <PerfilVista key={usuario.idUsuario} datos={{
    nombre: usuario.nombre,
    correo: usuario.correo,
    periodo,
    movilidad: [null, null, null],
    itinerarios: recientes.map(resumirItinerario),
    errorItinerarios,
    cargandoItinerarios,
  }} onCerrarSesion={() => {
    cerrarSesion()
    navegar('/login', { replace: true })
  }} />
}
