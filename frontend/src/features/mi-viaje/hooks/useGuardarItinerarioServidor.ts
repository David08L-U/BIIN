import { useCallback, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ApiError } from '../../../services/api'
import { useAuth } from '../../auth/useAuth'
import { itinerariosApi, type BorradorGuardable } from '../api/itinerariosApi'

export function useGuardarItinerarioServidor() {
  const { cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const enCurso = useRef(false)
  const [guardando, setGuardando] = useState(false)

  const guardar = useCallback(async (borrador: BorradorGuardable, editarId?: string) => {
    if (enCurso.current) return { itinerario: null, error: 'El guardado ya está en curso.' }
    enCurso.current = true
    setGuardando(true)
    try {
      return { itinerario: await itinerariosApi.guardar(borrador, editarId), error: null }
    } catch (error) {
      if (error instanceof ApiError && error.estado === 401) {
        const desde = ubicacion.pathname + ubicacion.search + ubicacion.hash
        cerrarSesion()
        navegar('/login', { replace: true, state: { desde } })
      }
      return {
        itinerario: null,
        error: error instanceof Error ? error.message : 'No se pudo confirmar el guardado en el servidor.',
      }
    } finally {
      enCurso.current = false
      setGuardando(false)
    }
  }, [cerrarSesion, navegar, ubicacion.hash, ubicacion.pathname, ubicacion.search])

  return { guardar, guardando }
}
