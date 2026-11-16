import { api } from '../../services/api'
import type { AuthResponse, LoginRequest, RegistroRequest, Usuario } from '../../types/auth'

export const authApi = {
  login: (datos: LoginRequest) => api.post<AuthResponse>('/auth/login', datos),
  registro: (datos: RegistroRequest) => api.post<AuthResponse>('/auth/registro', datos),
  yo: () => api.get<Usuario>('/auth/yo'),
}
