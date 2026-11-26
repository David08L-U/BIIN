import { useId, useState } from 'react'
import Icono from './IconoItinerario'

export default function ImagenItinerario({ src, alt, className = 'iz-plan-imagen', recorte }: {
  src?: string
  alt: string
  className?: string
  recorte?: string
}) {
  const [fallo, setFallo] = useState(false)
  const avisoId = useId()
  return <div className={className}>
    {fallo || !src ? <div role="img" aria-label={alt} aria-describedby={avisoId}>
      <Icono nombre="image" tamano={24} /><span id={avisoId}>Imagen del prototipo no disponible</span>
    </div> : <img src={src} alt={alt} style={recorte ? { objectViewBox: recorte } : undefined}
      onError={() => setFallo(true)} />}
  </div>
}
