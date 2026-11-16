import { useId, type InputHTMLAttributes } from 'react'

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
  ayuda?: string
}

/** Input con etiqueta visible y texto de ayuda accesible (RNF06). */
export default function Campo({ etiqueta, ayuda, id, ...props }: CampoProps) {
  const autoId = useId()
  const idCampo = id ?? autoId
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined

  return (
    <div className="campo">
      <label htmlFor={idCampo}>{etiqueta}</label>
      <input id={idCampo} aria-describedby={idAyuda} {...props} />
      {ayuda && <small id={idAyuda}>{ayuda}</small>}
    </div>
  )
}
