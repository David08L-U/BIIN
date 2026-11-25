import ModosPlan from './ModosPlan'
import { urlBorradorHomun } from '../plan/borradorHomun'
import type { BorradorHomun } from '../plan/itinerarioHomun'

export default function ModosHomun({ borrador }: { borrador: BorradorHomun }) {
  return <ModosPlan
    modo={borrador.modo}
    recomendado={urlBorradorHomun('itinerario', { ...borrador, modo: 'recomendado', generado: false })}
    personalizado={urlBorradorHomun('personalizar', { ...borrador, modo: 'personalizado', generado: false })}
  />
}
