import ModosPlan from './ModosPlan'
import { urlBorradorTekit } from '../plan/borradorTekit'
import type { BorradorTekit } from '../plan/itinerarioTekit'

export default function ModosTekit({ borrador, personalizado = false }: { borrador: BorradorTekit; personalizado?: boolean }) {
  return <ModosPlan
    modo={personalizado ? 'personalizado' : borrador.modo}
    recomendado={urlBorradorTekit('itinerario', { ...borrador, modo: 'recomendado', generado: false })}
    personalizado={urlBorradorTekit('personalizar', { ...borrador, modo: 'personalizado', generado: false })}
  />
}
