import ModosPlan from './ModosPlan'
import { urlBorradorTicul } from '../plan/borradorTicul'
import type { BorradorTicul } from '../plan/itinerarioTicul'

export default function ModosTicul({ borrador }: { borrador: BorradorTicul }) {
  return <ModosPlan
    modo={borrador.modo}
    recomendado={urlBorradorTicul('itinerario', { ...borrador, modo: 'recomendado', generado: false })}
    personalizado={urlBorradorTicul('personalizar', { ...borrador, modo: 'personalizado', generado: false })}
  />
}
