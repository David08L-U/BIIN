import { createContext } from 'react'
import type { LoginRequest, RegistroRequest, Rol, Usuario } from '../../types/auth'

export interface AuthContextValor {
  usuario: Usuario | null
  cargando: boolean
  errorRestauracion: string | null
  reintentarRestauracion: () => Promise<void>
  iniciarSesion: (datos: LoginRequest) => Promise<void>
  registrarse: (datos: RegistroRequest) => Promise<void>
  cerrarSesion: () => void
  tieneRol: (rol: Rol) => boolean
}

export const AuthContext = createContext<AuthContextValor | null>(null)
