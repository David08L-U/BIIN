import { useState } from 'react'

export default function FotografiaPublicada({ src, alt }: { src: string | null | undefined; alt: string }) {
  return <Imagen key={src ?? ''} src={src} alt={alt} />
}
function Imagen({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [fallo, setFallo] = useState(false)
  return src && !fallo ? <img className="foto-publicada" src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFallo(true)} /> :
    <div className="foto-publicada foto-publicada-vacia" role="img" aria-label={alt}>Fotografía no disponible</div>
}
