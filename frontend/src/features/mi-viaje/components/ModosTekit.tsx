import { Link } from 'react-router'
import { urlBorradorTekit } from '../plan/borradorTekit'
import type { BorradorTekit } from '../plan/itinerarioTekit'

export default function ModosTekit({ borrador, personalizado = false }: { borrador: BorradorTekit; personalizado?: boolean }) {
  return <div className="tk-modos" role="group" aria-label="Modo de planificación">
    <Link aria-current={!personalizado && borrador.modo === 'recomendado' ? 'page' : undefined} to={urlBorradorTekit('itinerario', { ...borrador, modo: 'recomendado', generado: false })}>Recomendado</Link>
    <Link aria-current={personalizado || borrador.modo === 'personalizado' ? 'page' : undefined} to={urlBorradorTekit('personalizar', { ...borrador, modo: 'personalizado', generado: false })}>Personalizado</Link>
  </div>
}
