import { useId, type InputHTMLAttributes } from 'react'

interface AccionCampo {
  etiqueta: string
  activa: boolean
  alActivar: () => void
  icono: string
}

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
  ayuda?: string
  icono?: string
  accion?: AccionCampo
}

/** Input con etiqueta visible y texto de ayuda accesible (RNF06). */
export default function Campo({ etiqueta, ayuda, icono, accion, id, ...props }: CampoProps) {
  const autoId = useId()
  const idCampo = id ?? autoId
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined

  return (
    <div className="campo">
      <label htmlFor={idCampo}>{etiqueta}</label>
      {icono || accion ? <div className="campo-control">
        {icono && <span className="biin-icon campo-icono" aria-hidden="true">{icono}</span>}
        <input id={idCampo} aria-describedby={idAyuda} {...props} />
        {accion && <button type="button" className="campo-accion" aria-label={accion.etiqueta}
          aria-pressed={accion.activa} onClick={accion.alActivar} disabled={props.disabled}>
          <span className="biin-icon" aria-hidden="true">{accion.icono}</span>
        </button>}
      </div> : <input id={idCampo} aria-describedby={idAyuda} {...props} />}
      {ayuda && <small id={idAyuda}>{ayuda}</small>}
    </div>
  )
}
