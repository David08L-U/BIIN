import { api } from '../../services/api'
import type {
  AuthResponse,
  CambiarContrasenaRequest,
  ConfirmarRecuperacionRequest,
  LoginRequest,
  PerfilUsuario,
  RecuperacionIniciadaResponse,
  RegistroPendiente,
  RegistroRequest,
  SolicitarRecuperacionRequest,
  VerificarRegistroRequest,
} from '../../types/auth'

export const authApi = {
  login: (datos: LoginRequest) => api.post<AuthResponse>('/auth/login', datos),
  /** Paso 1: manda el código al correo; la cuenta se crea al verificarlo. */
  registro: (datos: RegistroRequest) => api.post<RegistroPendiente>('/auth/registro', datos),
  /** Paso 2: confirma el código, crea la cuenta de viajero e inicia sesión. */
  verificarRegistro: (datos: VerificarRegistroRequest) =>
    api.post<AuthResponse>('/auth/registro/verificar', datos),
  reenviarCodigo: (correo: string) => api.post<RegistroPendiente>('/auth/registro/reenviar', { correo }),
  yo: () => api.get<PerfilUsuario>('/auth/yo'),
  logout: () => api.post<void>('/auth/logout'),
  cambiarContrasena: (datos: CambiarContrasenaRequest) => api.put<void>('/auth/contrasena', datos),
  solicitarRecuperacion: (datos: SolicitarRecuperacionRequest) =>
    api.post<RecuperacionIniciadaResponse>('/auth/recuperar-contrasena', datos),
  confirmarRecuperacion: (datos: ConfirmarRecuperacionRequest) =>
    api.post<void>('/auth/recuperar-contrasena/confirmar', datos),
}
