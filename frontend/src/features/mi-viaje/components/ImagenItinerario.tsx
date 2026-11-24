import { useState } from 'react'
import Icono from './IconoItinerario'

export default function ImagenItinerario({ src, alt, className = 'iz-plan-imagen' }: { src: string; alt: string; className?: string }) {
  const [fallo, setFallo] = useState(false)
  return <div className={className}>{fallo ? <div role="img" aria-label={alt}><Icono nombre="image" tamano={24} />Imagen del prototipo no disponible</div> : <img src={src} alt={alt} onError={() => setFallo(true)} />}</div>
}
