import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../services/api'
import type { ItinerarioDetalleDto } from '../api'

/** Serializa cambios para no sobrescribir una edición con otra respuesta más vieja. RF09. */
export function useOperacionItinerarioApi(actualizar: (resultado: ItinerarioDetalleDto) => void) {
  const bloqueo = useRef(false)
  const vivo = useRef(true)
  useEffect(() => { vivo.current = true; return () => { vivo.current = false } }, [])
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [incierto, setIncierto] = useState(false)
  async function ejecutar(operacion: () => Promise<ItinerarioDetalleDto>) {
    if (bloqueo.current || incierto) return
    bloqueo.current = true; setOcupado(true); setError(null)
    try { const resultado = await operacion(); if (vivo.current) actualizar(resultado) } catch (e) {
      const desconocido = !(e instanceof ApiError) || e.estado === 0 || e.estado >= 500
      setIncierto(desconocido)
      setError(`${e instanceof Error ? e.message : 'No se pudo guardar el cambio.'}${desconocido ? ' Recarga el itinerario para confirmar su estado antes de seguir editando.' : ''}`)
    } finally { bloqueo.current = false; setOcupado(false) }
  }
  return { ejecutar, ocupado: ocupado || incierto, error, incierto }
}
