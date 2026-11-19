import type { Plan } from '../../types/catalogo'
import { useAlmacenLocal } from '../../hooks/useAlmacenLocal'
export const esPlan = (x: unknown): x is Plan => {
  if (!x || typeof x !== 'object') return false
  const p = x as Partial<Plan>
  return (
    typeof p.id === 'string' &&
    typeof p.destinoId === 'string' &&
    typeof p.fecha === 'string' &&
    typeof p.inicio === 'string' &&
    typeof p.limite === 'number' &&
    typeof p.actualizadoEn === 'string' &&
    Array.isArray(p.actividades) &&
    p.actividades.every((a) => typeof a === 'string')
  )
}
const esLista = (x: unknown): x is Plan[] => Array.isArray(x) && x.every(esPlan)
export function usePlanes() {
  const [planes, setPlanes, error] = useAlmacenLocal(
    'biin.planes.v1',
    [],
    esLista,
  )
  return {
    planes,
    error,
    guardar: (p: Plan) =>
      setPlanes((prev) => [p, ...prev.filter((x) => x.id !== p.id)]),
    borrar: (id: string) =>
      setPlanes((prev) => prev.filter((x) => x.id !== id)),
  }
}
