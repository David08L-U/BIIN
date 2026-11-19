import type { ReactNode } from 'react'
import Icono from './Icono'
export default function EstadoVacio({
  titulo,
  children,
}: {
  titulo: string
  children?: ReactNode
}) {
  return (
    <div className="vacio">
      <span className="icono-caja">
        <Icono nombre="explorar" />
      </span>
      <h2>{titulo}</h2>
      <div className="muted">{children}</div>
    </div>
  )
}
