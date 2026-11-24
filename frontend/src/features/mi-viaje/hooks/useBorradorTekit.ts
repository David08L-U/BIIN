import { useSearchParams } from 'react-router'
import type { BorradorTekit } from '../plan/itinerarioTekit'
import type { ModoItinerario } from '../plan/itinerarioIzamal'
import { leerBorradorTekit, parametrosBorradorTekit } from '../plan/borradorTekit'

/** URL sin datos de cuenta: borrador recuperable por recarga, volver y acceso. */
export function useBorradorTekit(modoInicial?: ModoItinerario) {
  const [parametros, setParametros] = useSearchParams()
  const borrador = leerBorradorTekit(parametros, modoInicial)
  if (modoInicial && (borrador.modo === 'recomendado' || borrador.modo === 'personalizado')) borrador.modo = modoInicial
  function actualizar(cambios: Partial<BorradorTekit>) {
    setParametros(parametrosBorradorTekit({ ...borrador, generado: false, ...cambios }), { replace: true })
  }
  return { borrador, actualizar }
}
