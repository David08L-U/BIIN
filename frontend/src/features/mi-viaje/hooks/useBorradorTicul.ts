import { useSearchParams } from 'react-router'
import { leerBorradorTicul, parametrosBorradorTicul } from '../plan/borradorTicul'
import type { BorradorTicul } from '../plan/itinerarioTicul'
import type { ModoItinerario } from '../plan/itinerarioIzamal'

export function useBorradorTicul(modo?: ModoItinerario) {
  const [parametros, setParametros] = useSearchParams()
  const borrador = leerBorradorTicul(parametros, modo)
  if (modo && (borrador.modo === 'recomendado' || borrador.modo === 'personalizado')) borrador.modo = modo
  function actualizar(cambios: Partial<BorradorTicul>) {
    setParametros(parametrosBorradorTicul({ ...borrador, generado: false, ...cambios }), { replace: true })
  }
  return { borrador, actualizar }
}
