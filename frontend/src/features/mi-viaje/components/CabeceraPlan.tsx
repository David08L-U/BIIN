import type { ReactNode } from 'react'
import { Link } from 'react-router'
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
  const encabezado = <h1 id={id}>{titulo}</h1>
  const ceja = <p className="iz-plan-ceja">{subtitulo}</p>

  return <header className={personalizar ? 'iz-plan-cabecera iz-personalizar-cabecera' : 'iz-plan-cabecera'}>
    <Link className="iz-plan-icono-boton" to={volver} aria-label="Volver a detalle de ruta">
      <Icono nombre="arrow_back" tamano={personalizar ? 24 : 16} />
    </Link>
    <div className={personalizar ? undefined : 'iz-plan-titulo'}>
      {personalizar ? <>{encabezado}{ceja}</> : <>{ceja}{encabezado}</>}
    </div>
    <div className={personalizar ? 'iz-personalizar-utilidades' : 'iz-plan-utilidades'}>{acciones}</div>
  </header>
}
