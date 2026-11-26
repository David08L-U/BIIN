import { Link } from 'react-router'

export default function CancelarEdicion({ editarId }: { editarId?: string }) {
  return editarId ? <Link className="iz-plan-restablecer" to="/mi-viaje">Cancelar cambios y volver a Mi viaje</Link> : null
}
