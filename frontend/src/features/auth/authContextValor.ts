import { createContext } from 'react'
import type {
  LoginRequest,
  RegistroPendiente,
  RegistroRequest,
  Rol,
  Usuario,
  VerificarRegistroRequest,
} from '../../types/auth'

export interface AuthContextValor {
  usuario: Usuario | null
  cargando: boolean
  errorRestauracion: string | null
  reintentarRestauracion: () => Promise<void>
  iniciarSesion: (datos: LoginRequest) => Promise<void>
  /** Paso 1 del registro de viajero: manda el código al correo, todavía no inicia sesión. */
  registrarse: (datos: RegistroRequest) => Promise<RegistroPendiente>
  /** Paso 2: confirma el código, crea la cuenta e inicia sesión. */
  verificarRegistro: (datos: VerificarRegistroRequest) => Promise<void>
  reenviarCodigo: (correo: string) => Promise<RegistroPendiente>
  cerrarSesion: () => void
  tieneRol: (rol: Rol) => boolean
}

export const AuthContext = createContext<AuthContextValor | null>(null)
