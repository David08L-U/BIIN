import { useSearchParams } from 'react-router'
import { leerBorradorIzamal, parametrosBorrador } from '../plan/borradorIzamal'
import type { BorradorIzamal, ModoItinerario } from '../plan/itinerarioIzamal'

/** La URL es el borrador: recarga, navegación y retorno de login conservan los campos. */
export function useBorradorIzamal(modo?: ModoItinerario) {
  const [parametros, setParametros] = useSearchParams()
  const borrador = leerBorradorIzamal(parametros)
  if (modo) borrador.modo = modo
  function actualizar(cambios: Partial<BorradorIzamal>) {
    setParametros(parametrosBorrador({ ...borrador, generado: false, ...cambios }), { replace: true })
  }
  return { borrador, actualizar }
}
