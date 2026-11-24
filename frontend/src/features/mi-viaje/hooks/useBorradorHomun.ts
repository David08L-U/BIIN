import { useSearchParams } from 'react-router'
import { leerBorradorHomun, parametrosBorradorHomun } from '../plan/borradorHomun'
import { esModoItinerario } from '../plan/recorridoJornadas'
import type { BorradorHomun } from '../plan/itinerarioHomun'
import type { ModoItinerario } from '../plan/itinerarioIzamal'

export function useBorradorHomun(modo?: ModoItinerario) {
  const [parametros, setParametros] = useSearchParams()
  const borrador = leerBorradorHomun(parametros, modo)
  if (modo && esModoItinerario(borrador.modo)) borrador.modo = modo
  function actualizar(cambios: Partial<BorradorHomun>) {
    setParametros(parametrosBorradorHomun({ ...borrador, generado: false, ...cambios }), { replace: true })
  }
  return { borrador, actualizar }
}
