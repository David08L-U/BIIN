import { useState } from 'react'
import Icono from './IconoItinerario'

export default function ImagenItinerario({ src, alt }: { src: string; alt: string }) {
  const [fallo, setFallo] = useState(false)
  return <div className="iz-plan-imagen">{fallo ? <div role="img" aria-label={alt}><Icono nombre="image" tamano={24} />Imagen del prototipo no disponible</div> : <img src={src} alt={alt} onError={() => setFallo(true)} />}</div>
}
