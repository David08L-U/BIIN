import { useEffect, useRef, useState } from 'react'
import { DomEvent } from 'leaflet'
import { useMap } from 'react-leaflet'
import MapaBase from '../../../maps/MapaBase'

function ControlesMapa() {
  const mapa = useMap()
  const controles = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const elemento = controles.current!
    DomEvent.disableClickPropagation(elemento)
    DomEvent.disableScrollPropagation(elemento)
    return () => { DomEvent.off(elemento) }
  }, [])
  return <div ref={controles} className="melanie-controles">
    <div className="melanie-zoom">
      <button type="button" aria-label="Acercar mapa" onClick={() => mapa.zoomIn(1, { animate: false })}>
        <span aria-hidden="true" className="biin-icon">add</span>
      </button>
      <button type="button" aria-label="Alejar mapa" onClick={() => mapa.zoomOut(1, { animate: false })}>
        <span aria-hidden="true" className="biin-icon">remove</span>
      </button>
    </div>
  </div>
}

export default function MapaInicio() {
  const [fallo, setFallo] = useState(false)
  const falloEnCarga = useRef(false)
  return <>
    <MapaBase alto="100%" zoom={13} controlZoom={false} eventosTeselas={{
      loading: () => { falloEnCarga.current = false },
      tileerror: () => { falloEnCarga.current = true; setFallo(true) },
      load: () => setFallo(falloEnCarga.current),
    }}>
      <ControlesMapa />
    </MapaBase>
    <div className="melanie-mapa-nota">
      <div>Vista general de Mérida · Referencia</div>
      {fallo && <div role="status">No se pudo cargar parte del mapa.</div>}
    </div>
  </>
}
