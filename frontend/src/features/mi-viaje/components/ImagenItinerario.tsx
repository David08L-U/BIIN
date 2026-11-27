import { useId, useState } from 'react'
import Icono from './IconoItinerario'

export default function ImagenItinerario({ src, alt, className = 'iz-plan-imagen', recorte, credito, fuente }: {
  src?: string
  alt: string
  className?: string
  recorte?: string
  credito?: string
  fuente?: string
}) {
  const [fallo, setFallo] = useState(false)
  const avisoId = useId()
  return <div className={className}>
    {fallo || !src ? <div role="img" aria-label={alt} aria-describedby={avisoId}>
      <Icono nombre="image" tamano={24} /><span id={avisoId}>{src ? 'Imagen no disponible' : 'Fotografía pendiente de verificación'}</span>
    </div> : <img src={src} alt={alt} loading="lazy" decoding="async"
      style={recorte ? { objectFit: 'cover', objectPosition: 'center' } : undefined}
      onError={() => setFallo(true)} />}
    {src && !fallo && credito && fuente && <a className="iz-plan-imagen-credito" href={fuente} target="_blank" rel="noreferrer">Foto: {credito}</a>}
  </div>
}
