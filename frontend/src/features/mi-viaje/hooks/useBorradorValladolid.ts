import { useSearchParams } from 'react-router'
import type { ModoItinerario } from '../plan/itinerarioIzamal'
import { leerBorradorValladolid, parametrosBorradorValladolid } from '../plan/borradorValladolid'
import { esModoItinerario } from '../plan/itinerarioValladolid'
import type { BorradorValladolid } from '../plan/itinerarioValladolid'

/** La URL conserva campos, jornadas y selección durante recarga y acceso. */
export function useBorradorValladolid(modo?: ModoItinerario) {
  const [parametros, setParametros] = useSearchParams()
  const borrador = leerBorradorValladolid(parametros, modo)
  if (modo && esModoItinerario(borrador.modo)) borrador.modo = modo
  function actualizar(cambios: Partial<BorradorValladolid>) {
    setParametros(parametrosBorradorValladolid({ ...borrador, generado: false, ...cambios }), { replace: true })
  }
  return { borrador, actualizar }
}
