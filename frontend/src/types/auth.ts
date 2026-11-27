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

/** El registro quedó pendiente: llegó un código al correo (la cuenta aún no existe). */
export interface RegistroPendiente {
  correo: string
  expiraEn: string
  reenviarDesde: string
}

export interface VerificarRegistroRequest {
  correo: string
  codigo: string
}

export interface RutaOperada {
  idRuta: number
  codigo: string
  titulo: string
  activa: boolean
}

export interface PerfilUsuario extends Usuario {
  activo: boolean
  fechaRegistro: string
  rutasOperadas: RutaOperada[]
}

export interface ResumenPerfil extends PerfilUsuario {
  itinerariosGuardados: number
  favoritosGuardados: number
}

export interface ActualizarPerfilRequest {
  nombre: string
  correo: string
}

export interface CambiarContrasenaRequest {
  contrasenaActual: string
  contrasenaNueva: string
}

export interface DesactivarCuentaRequest {
  contrasenaActual: string
}

export interface SolicitarRecuperacionRequest {
  correo: string
}

export interface ConfirmarRecuperacionRequest {
  correo: string
  codigo: string
  contrasenaNueva: string
}

export interface RecuperacionIniciadaResponse {
  mensaje: string
  minutosVigencia: number
}
