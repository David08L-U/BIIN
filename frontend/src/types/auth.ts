export type Rol = 'viajero' | 'colaborador' | 'operador' | 'administrador'

export interface Usuario {
  idUsuario: number
  nombre: string
  correo: string
  roles: Rol[]
}

export interface AuthResponse {
  token: string
  expiraEn: string
  usuario: Usuario
}

export interface LoginRequest {
  correo: string
  contrasena: string
}

export interface RegistroRequest extends LoginRequest {
  nombre: string
}
