import { Link } from 'react-router'
import { urlBorradorHomun } from '../plan/borradorHomun'
import type { BorradorHomun } from '../plan/itinerarioHomun'

export default function ModosHomun({ borrador }: { borrador: BorradorHomun }) {
  return <div className="hm-modos" role="group" aria-label="Modo de planificación">
    <Link aria-current={borrador.modo === 'recomendado' ? 'page' : undefined} to={urlBorradorHomun('itinerario', { ...borrador, modo: 'recomendado', generado: false })}>Recomendado</Link>
    <Link aria-current={borrador.modo === 'personalizado' ? 'page' : undefined} to={urlBorradorHomun('personalizar', { ...borrador, modo: 'personalizado', generado: false })}>Personalizado</Link>
  </div>
}
