import { Link } from 'react-router'
import type { ReactNode } from 'react'
import Icono from './Icono'
export default function CabeceraPagina({
  titulo,
  subtitulo,
  volver = '/',
  acciones,
}: {
  titulo: string
  subtitulo?: string
  volver?: string
  acciones?: ReactNode
}) {
  return (
    <header className="cabecera-pagina">
      <Link className="icon-button" to={volver} aria-label="Regresar">
        <Icono nombre="volver" />
      </Link>
      <div className="cabecera-texto">
        {subtitulo && <span className="eyebrow">{subtitulo}</span>}
        <h1>{titulo}</h1>
      </div>
      {acciones}
    </header>
  )
}
