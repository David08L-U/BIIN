import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import Icono from './IconoItinerario'
import '../../../styles/itinerario-izamal.css'

export default function CabeceraPlan({ id, titulo, subtitulo, volver, acciones, personalizar = false }: {
  id: string
  titulo: string
  subtitulo: string
  volver: string
  acciones: ReactNode
  personalizar?: boolean
}) {
  const location = useLocation()
  const estado = location.state as { volverPlan?: unknown } | null
  const volverPlan = typeof estado?.volverPlan === 'string' && /^\/recorridos\/crear\/(?:izamal|valladolid|tekit|homun|ticul)$/.test(estado.volverPlan)
    ? estado.volverPlan
    : null
  const encabezado = <h1 id={id}>{titulo}</h1>
  const ceja = <p className="iz-plan-ceja">{subtitulo}</p>

  return <header className={personalizar ? 'iz-plan-cabecera iz-personalizar-cabecera' : 'iz-plan-cabecera'}>
    <Link className="iz-plan-icono-boton" to={volverPlan ?? volver} aria-label={volverPlan ? 'Volver a elegir modalidad' : 'Volver a detalle de ruta'}>
      <Icono nombre="arrow_back" tamano={personalizar ? 24 : 16} />
    </Link>
    <div className={personalizar ? undefined : 'iz-plan-titulo'}>
      {personalizar ? <>{encabezado}{ceja}</> : <>{ceja}{encabezado}</>}
    </div>
    <div className={personalizar ? 'iz-personalizar-utilidades' : 'iz-plan-utilidades'}>{acciones}</div>
  </header>
}
