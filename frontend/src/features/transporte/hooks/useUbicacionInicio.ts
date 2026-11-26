import { useCallback, useEffect, useRef, useState } from 'react'

export interface Ubicacion {
  punto: [number, number]
  precision: number
}

type Seguimiento = { api: Geolocation; id?: number }
type PermisoUbicacion = 'consultando' | 'prompt' | 'granted' | 'denied' | 'unavailable'

const mensajesError: Record<number, string> = {
  1: 'Permiso de ubicación rechazado. Abre los permisos del sitio junto a la barra de direcciones y permite Ubicación.',
  2: 'Ubicación no disponible.',
  3: 'Se agotó el tiempo de espera para obtener la ubicación.',
}

export function useUbicacionInicio(centrar: (posicion: Ubicacion) => void) {
  const [posicion, setPosicion] = useState<Ubicacion | null>(null)
  const [permiso, setPermiso] = useState<PermisoUbicacion>(() => typeof navigator !== 'undefined' && 'permissions' in navigator ? 'consultando' : 'prompt')
  const [invitacionOmitida, setInvitacionOmitida] = useState(false)
  const [estado, setEstado] = useState<{ tipo: 'inicial' | 'solicitando' | 'vigente' } | { tipo: 'error'; mensaje: string }>({ tipo: 'inicial' })
  const activo = useRef<Seguimiento | null>(null)
  const centrarRef = useRef(centrar)
  const cleanupPermiso = useRef<(() => void) | null>(null)
  useEffect(() => { centrarRef.current = centrar }, [centrar])

  const detener = useCallback(() => {
    const seguimiento = activo.current
    activo.current = null
    if (seguimiento?.id !== undefined) seguimiento.api.clearWatch(seguimiento.id)
  }, [])

  const informarError = useCallback((mensaje: string, seguimiento?: Seguimiento) => {
    if (seguimiento && activo.current !== seguimiento) return
    if (seguimiento) detener()
    setEstado({ tipo: 'error', mensaje })
  }, [detener])

  const iniciarSeguimiento = useCallback(() => {
    if (activo.current) return
    if (!window.isSecureContext) {
      informarError('La ubicación requiere una conexión segura (HTTPS).')
      return
    }
    const api = navigator.geolocation
    if (!api || typeof api.watchPosition !== 'function') {
      setPermiso('unavailable')
      informarError('Este navegador no admite la geolocalización.')
      return
    }

    setEstado({ tipo: 'solicitando' })
    const seguimiento: Seguimiento = { api }
    activo.current = seguimiento
    let primera = true
    try {
      const id = api.watchPosition(({ coords }) => {
        if (activo.current !== seguimiento) return
        const nueva: Ubicacion = { punto: [coords.latitude, coords.longitude], precision: coords.accuracy }
        setPosicion(nueva)
        setEstado({ tipo: 'vigente' })
        if (primera) {
          primera = false
          centrarRef.current(nueva)
        }
      }, error => {
        if (error.code === 1) setPermiso('denied')
        informarError(mensajesError[error.code] ?? mensajesError[2], seguimiento)
      }, { maximumAge: 0, timeout: 10_000 })
      if (activo.current === seguimiento) seguimiento.id = id
      else api.clearWatch(id)
    } catch {
      informarError(mensajesError[2], seguimiento)
    }
  }, [informarError])

  useEffect(() => {
    let vigente = true
    const permisos = navigator.permissions
    if (!permisos?.query) {
      return () => { vigente = false; detener() }
    }
    void permisos.query({ name: 'geolocation' }).then(status => {
      if (!vigente) return
      const actualizar = () => {
        if (!vigente) return
        setPermiso(status.state)
        if (status.state === 'granted') iniciarSeguimiento()
        if (status.state === 'denied') {
          detener()
          setEstado({ tipo: 'error', mensaje: mensajesError[1] })
        }
      }
      actualizar()
      status.addEventListener('change', actualizar)
      // Safari anterior expone onchange sin EventTarget.
      if (!status.addEventListener) status.onchange = actualizar
      cleanupPermiso.current = () => {
        status.removeEventListener?.('change', actualizar)
        if (status.onchange === actualizar) status.onchange = null
      }
    }).catch(() => { if (vigente) setPermiso('prompt') })
    return () => {
      vigente = false
      cleanupPermiso.current?.()
      cleanupPermiso.current = null
      detener()
    }
  }, [detener, iniciarSeguimiento])

  function usarUbicacion() {
    if (permiso === 'denied') {
      setEstado({ tipo: 'error', mensaje: mensajesError[1] })
      return
    }
    if (permiso === 'unavailable') return
    if (activo.current) {
      if (estado.tipo === 'vigente' && posicion) centrarRef.current(posicion)
      return
    }
    setInvitacionOmitida(true)
    setPermiso('prompt')
    iniciarSeguimiento()
  }

  const ahoraNo = () => setInvitacionOmitida(true)
  const mostrarInvitacion = permiso === 'prompt' && !invitacionOmitida && estado.tipo === 'inicial'
  return { posicion, estado, permiso, mostrarInvitacion, usarUbicacion, ahoraNo }
}
