import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, tokenAlmacenado } from '../../services/api'
import type { AuthResponse, Usuario } from '../../types/auth'
import { authApi } from './api'
import { AuthContext, type AuthContextValor } from './authContextValor'
import { expiracionJwtEnMs } from './expiracionJwt'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(() => tokenAlmacenado.leer() !== null)
  const [errorRestauracion, setErrorRestauracion] = useState<string | null>(null)

  const reintentarRestauracion = useCallback(async () => {
    const token = tokenAlmacenado.leer()
    if (!token) {
      setUsuario(null)
      setErrorRestauracion(null)
      setCargando(false)
      return
    }

    setCargando(true)
    try {
      setUsuario(await authApi.yo())
      setErrorRestauracion(null)
    } catch (error) {
      if (error instanceof ApiError && error.estado === 401) {
        tokenAlmacenado.borrar()
        setUsuario(null)
        setErrorRestauracion(null)
      } else {
        // Un fallo transitorio no demuestra que la sesión haya caducado.
        setErrorRestauracion('No se pudo validar tu sesión. Comprueba la conexión e inténtalo de nuevo.')
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (!tokenAlmacenado.leer()) return
    const timer = window.setTimeout(() => void reintentarRestauracion(), 0)
    return () => window.clearTimeout(timer)
  }, [reintentarRestauracion])

  useEffect(() => {
    const token = tokenAlmacenado.leer()
    if (!token) return
    const expiracion = expiracionJwtEnMs(token)
    if (expiracion === null) return
    // El backend admite un margen de reloj de un minuto; revalida al agotarse.
    const demora = Math.max(0, expiracion + 60_000 - Date.now())
    const timer = window.setTimeout(() => void reintentarRestauracion(), demora)
    return () => window.clearTimeout(timer)
  }, [usuario, reintentarRestauracion])

  const aplicar = useCallback((respuesta: AuthResponse) => {
    tokenAlmacenado.guardar(respuesta.token)
    setUsuario(respuesta.usuario)
    setErrorRestauracion(null)
    setCargando(false)
  }, [])

  const valor = useMemo<AuthContextValor>(
    () => ({
      usuario,
      cargando,
      errorRestauracion,
      reintentarRestauracion,
      iniciarSesion: async (datos) => aplicar(await authApi.login(datos)),
      registrarse: async (datos) => aplicar(await authApi.registro(datos)),
      cerrarSesion: () => {
        tokenAlmacenado.borrar()
        setUsuario(null)
        setErrorRestauracion(null)
        setCargando(false)
      },
      tieneRol: (rol) => usuario?.roles.includes(rol) ?? false,
    }),
    [usuario, cargando, errorRestauracion, reintentarRestauracion, aplicar],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
