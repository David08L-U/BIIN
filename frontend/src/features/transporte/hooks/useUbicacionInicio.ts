import { useCallback, useEffect, useRef, useState } from 'react'

export interface Ubicacion {
  punto: [number, number]
  precision: number
}

type Seguimiento = { api: Geolocation; id?: number }

const mensajesError: Record<number, string> = {
  1: 'Permiso de ubicación rechazado. Abre los permisos del sitio junto a la barra de direcciones, permite Ubicación y pulsa Usar mi ubicación otra vez.',
  2: 'Ubicación no disponible.',
  3: 'Se agotó el tiempo de espera para obtener la ubicación.',
}

export function useUbicacionInicio(centrar: (posicion: Ubicacion) => void) {
  const [posicion, setPosicion] = useState<Ubicacion | null>(null)
  const [estado, setEstado] = useState<{ tipo: 'inicial' | 'solicitando' | 'vigente' } | { tipo: 'error'; mensaje: string }>({ tipo: 'inicial' })
  const activo = useRef<Seguimiento | null>(null)
  const detener = useCallback(() => {
    const seguimiento = activo.current
    activo.current = null
    if (seguimiento?.id !== undefined) seguimiento.api.clearWatch(seguimiento.id)
  }, [])

  useEffect(() => detener, [detener])

  function usarUbicacion() {
    if (activo.current) {
      if (estado.tipo === 'vigente' && posicion) centrar(posicion)
      return
    }
    if (!window.isSecureContext) {
      setEstado({ tipo: 'error', mensaje: 'La ubicación requiere una conexión segura (HTTPS).' })
      return
    }
    const api = navigator.geolocation
    if (!api || typeof api.watchPosition !== 'function') {
      setEstado({ tipo: 'error', mensaje: 'Este navegador no admite la geolocalización.' })
      return
    }

    setEstado({ tipo: 'solicitando' })
    const seguimiento: Seguimiento = { api }
    activo.current = seguimiento
    let primera = true
    function informarError(mensaje: string) {
      if (activo.current !== seguimiento) return
      detener()
      setEstado({ tipo: 'error', mensaje })
    }
    try {
      const id = api.watchPosition(({ coords }) => {
        if (activo.current !== seguimiento) return
        const nueva: Ubicacion = { punto: [coords.latitude, coords.longitude], precision: coords.accuracy }
        setPosicion(nueva)
        setEstado({ tipo: 'vigente' })
        if (primera) {
          primera = false
          centrar(nueva)
        }
      }, error => informarError(mensajesError[error.code] ?? mensajesError[2]), {
        maximumAge: 0,
        timeout: 10_000,
      })
      if (activo.current === seguimiento) seguimiento.id = id
      else api.clearWatch(id)
    } catch {
      informarError(mensajesError[2])
    }
  }

  return { posicion, estado, usarUbicacion }
}
