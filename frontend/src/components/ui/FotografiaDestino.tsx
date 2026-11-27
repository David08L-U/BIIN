import { useState } from 'react'

export interface FotoVerificada {
  src: string
  alt: string
  credito: string
  fuente: string
}

export default function FotografiaDestino({ foto, destino, className }: {
  foto?: FotoVerificada
  destino: string
  className: string
}) {
  const [fallo, setFallo] = useState(false)
  const pendiente = !foto
  return <span className={className}>
    {foto && !fallo
      ? <img src={foto.src} alt={foto.alt} loading="lazy" decoding="async" onError={() => setFallo(true)} />
      : <span className="fotografia-destino-pendiente" role="img" aria-label={`Fotografía ${pendiente ? 'pendiente de verificar' : 'no disponible'} de ${destino}`}>
        {pendiente ? 'Foto pendiente' : 'Foto no disponible'}
      </span>}
  </span>
}
