import type { ButtonHTMLAttributes } from 'react'

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario'
}

export default function Boton({ variante = 'primario', className = '', ...props }: BotonProps) {
  return <button className={`boton boton--${variante} ${className}`.trim()} {...props} />
}
