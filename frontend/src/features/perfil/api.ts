import { api } from '../../services/api'
import type {
  ActualizarPerfilRequest,
  DesactivarCuentaRequest,
  PerfilUsuario,
  ResumenPerfil,
} from '../../types/auth'

/** Cliente HTTP alineado con UsuariosController (/api/usuarios/perfil) para la vista de Perfil (CU-01). */
export const perfilApi = {
  obtener: () => api.get<PerfilUsuario>('/usuarios/perfil'),
  obtenerResumen: () => api.get<ResumenPerfil>('/usuarios/perfil/resumen'),
  actualizar: (datos: ActualizarPerfilRequest) => api.put<PerfilUsuario>('/usuarios/perfil', datos),
  desactivarCuenta: (datos: DesactivarCuentaRequest) => api.delete<void>('/usuarios/perfil', datos),
}
