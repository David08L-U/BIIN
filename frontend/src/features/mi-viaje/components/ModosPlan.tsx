import { Link } from 'react-router'

export default function ModosPlan({ recomendado, personalizado, modo }: {
  recomendado: string
  personalizado: string
  modo: string
}) {
  return <div className="plan-modos" role="group" aria-label="Modo de planificación">
    <Link aria-current={modo === 'recomendado' ? 'page' : undefined} to={recomendado}>Recomendado</Link>
    <Link aria-current={modo === 'personalizado' ? 'page' : undefined} to={personalizado}>Personalizado</Link>
  </div>
}
