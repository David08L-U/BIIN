import { Link } from 'react-router'
import { urlBorradorTicul } from '../plan/borradorTicul'
import type { BorradorTicul } from '../plan/itinerarioTicul'

export default function ModosTicul({ borrador }: { borrador: BorradorTicul }) {
  return <div className="ti-modos" role="group" aria-label="Modo de planificación">
    <Link aria-current={borrador.modo === 'recomendado' ? 'page' : undefined} to={urlBorradorTicul('itinerario', { ...borrador, modo: 'recomendado', generado: false })}>Recomendado</Link>
    <Link aria-current={borrador.modo === 'personalizado' ? 'page' : undefined} to={urlBorradorTicul('personalizar', { ...borrador, modo: 'personalizado', generado: false })}>Personalizado</Link>
  </div>
}
