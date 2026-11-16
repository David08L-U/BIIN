import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { tokenAlmacenado } from '../../services/api'
import type { AuthResponse, Usuario } from '../../types/auth'
import { authApi } from './api'
import { AuthContext, type AuthContextValor } from './authContextValor'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(() => tokenAlmacenado.leer() !== null)

  // Recupera la sesión guardada al abrir la app
  useEffect(() => {
    if (!tokenAlmacenado.leer()) return
    authApi
      .yo()
      .then(setUsuario)
      .catch(() => tokenAlmacenado.borrar())
      .finally(() => setCargando(false))
  }, [])

  const aplicar = useCallback((r: AuthResponse) => {
    tokenAlmacenado.guardar(r.token)
    setUsuario(r.usuario)
  }, [])

  const valor = useMemo<AuthContextValor>(
    () => ({
      usuario,
      cargando,
      iniciarSesion: async (datos) => aplicar(await authApi.login(datos)),
      registrarse: async (datos) => aplicar(await authApi.registro(datos)),
      cerrarSesion: () => {
        tokenAlmacenado.borrar()
        setUsuario(null)
      },
      tieneRol: (rol) => usuario?.roles.includes(rol) ?? false,
    }),
    [usuario, cargando, aplicar],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
