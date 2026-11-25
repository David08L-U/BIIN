import { useEffect, useRef, useState } from 'react'
import { DomEvent } from 'leaflet'
import { Circle, CircleMarker, useMap } from 'react-leaflet'
import MapaBase from '../../../maps/MapaBase'
import { useUbicacionInicio } from '../hooks/useUbicacionInicio'

function ContenidoMapa({ fallo }: { fallo: boolean }) {
  const mapa = useMap()
  const { posicion, estado, usarUbicacion } = useUbicacionInicio(({ punto }) => mapa.panTo(punto, { animate: false }))
  const desactualizada = posicion !== null && estado.tipo !== 'vigente'
  const color = desactualizada ? '#625954' : '#1769aa'
  const controles = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const elemento = controles.current!
    DomEvent.disableClickPropagation(elemento)
    DomEvent.disableScrollPropagation(elemento)
    return () => { DomEvent.off(elemento) }
  }, [])
  return <>
    {posicion && <>
      <Circle center={posicion.punto} radius={posicion.precision} pathOptions={{ color, fillOpacity: 0.15, weight: 2, interactive: false }} />
      <CircleMarker center={posicion.punto} radius={6} pathOptions={{ color: '#fff', fillColor: color, fillOpacity: 1, weight: 2, interactive: false }} />
    </>}
    <div ref={controles} className="melanie-controles">
      <button type="button" className="biin-icon-button" aria-label={estado.tipo === 'vigente' ? 'Centrar en mi ubicación' : 'Usar mi ubicación'} onClick={usarUbicacion}>
        <span aria-hidden="true" className="biin-icon">my_location</span>
      </button>
      <div className="melanie-zoom">
        <button type="button" aria-label="Acercar mapa" onClick={() => mapa.zoomIn(1, { animate: false })}>
          <span aria-hidden="true" className="biin-icon">add</span>
        </button>
        <button type="button" aria-label="Alejar mapa" onClick={() => mapa.zoomOut(1, { animate: false })}>
          <span aria-hidden="true" className="biin-icon">remove</span>
        </button>
      </div>
    </div>
    <div className="melanie-mapa-nota">
      {!posicion && <div>Vista general de Mérida · Referencia</div>}
      <div aria-live="polite" aria-atomic="true">
        {posicion && <div>
          {desactualizada ? 'Última ubicación desactualizada' : 'Ubicación aproximada'} · Precisión estimada de {Math.ceil(posicion.precision)} m
        </div>}
        {estado.tipo === 'solicitando' && <div>Solicitando ubicación…</div>}
        {estado.tipo === 'error' && <div>{estado.mensaje}</div>}
      </div>
      {fallo && <div role="status">No se pudo cargar parte del mapa.</div>}
    </div>
  </>
}

export default function MapaInicio() {
  const [fallo, setFallo] = useState(false)
  const falloEnCarga = useRef(false)
  return <MapaBase alto="100%" zoom={13} controlZoom={false} eventosTeselas={{
    loading: () => { falloEnCarga.current = false },
    tileerror: () => { falloEnCarga.current = true; setFallo(true) },
    load: () => setFallo(falloEnCarga.current),
  }}>
    <ContenidoMapa fallo={fallo} />
  </MapaBase>
}
