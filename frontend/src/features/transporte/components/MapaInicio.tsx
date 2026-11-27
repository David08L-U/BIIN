import { useEffect, useRef, useState } from 'react'
import { DomEvent, icon } from 'leaflet'
import { Circle, Marker, Tooltip, useMap } from 'react-leaflet'
import MapaBase from '../../../maps/MapaBase'
import { encuadrarUbicacion } from '../../../maps/encuadreUbicacion'
import { useUbicacionInicio } from '../hooks/useUbicacionInicio'

const marquesita = icon({
  iconUrl: `${import.meta.env.BASE_URL}assets/marquesita-melanie.jpg`,
  className: 'melanie-ubicacion-marquesita',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  tooltipAnchor: [0, -30],
})

function ContenidoMapa({ fallo }: { fallo: boolean }) {
  const mapa = useMap()
  const { posicion, estado, permiso, usarUbicacion, mostrarInvitacion, ahoraNo } = useUbicacionInicio(({ punto }) => encuadrarUbicacion(mapa, punto))
  const obteniendoPrimeraPosicion = !posicion && (permiso === 'consultando' || estado.tipo === 'solicitando')
  const desactualizada = posicion !== null && estado.tipo !== 'vigente'
  const color = desactualizada ? '#625954' : '#1769aa'
  const controles = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const elemento = controles.current
    if (!elemento) return
    DomEvent.disableClickPropagation(elemento)
    DomEvent.disableScrollPropagation(elemento)
    return () => { DomEvent.off(elemento) }
  }, [])
  return <>
    {obteniendoPrimeraPosicion && <div className="melanie-mapa-espera" role="status" aria-live="polite">
      <span>Obteniendo tu ubicación…</span>
    </div>}
    {posicion && <>
      <Circle center={posicion.punto} radius={posicion.precision} pathOptions={{ color, fillOpacity: 0.15, weight: 2, interactive: false }} />
      <Marker position={posicion.punto} icon={marquesita} alt="" keyboard={false} interactive={false} opacity={desactualizada ? 0.65 : 1}>
        <Tooltip permanent direction="top" className="melanie-ubicacion-etiqueta">
          {desactualizada ? 'Última ubicación' : 'Tu ubicación'}
        </Tooltip>
      </Marker>
    </>}
    <div ref={controles} className="melanie-controles">
      <button type="button" className="biin-icon-button" aria-label={estado.tipo === 'vigente' ? 'Mi ubicación' : 'Usar ubicación del mapa'} onClick={usarUbicacion}>
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
    {mostrarInvitacion && <section className="melanie-ubicacion-invitacion" aria-labelledby="titulo-invitacion-ubicacion">
      <p id="titulo-invitacion-ubicacion">¿Quieres usar tu ubicación para centrar el mapa?</p>
      <button type="button" onClick={usarUbicacion}>Usar mi ubicación</button>
      <button type="button" onClick={ahoraNo}>Ahora no</button>
    </section>}
    <div className="melanie-mapa-nota">
      {!posicion && !obteniendoPrimeraPosicion && <div>Vista general de Mérida · Referencia</div>}
      <div aria-live="polite" aria-atomic="true">
        {posicion && <div>
          {desactualizada ? 'Última ubicación desactualizada' : 'Tu ubicación aproximada'} · Precisión estimada de {Math.ceil(posicion.precision)} m
        </div>}
        {estado.tipo === 'solicitando' && !obteniendoPrimeraPosicion && <div>Solicitando ubicación…</div>}
        {estado.tipo === 'error' && <div>{estado.mensaje}</div>}
      </div>
      {fallo && <div role="status">No se pudo cargar parte del mapa.</div>}
    </div>
  </>
}

export default function MapaInicio() {
  const [fallo, setFallo] = useState(false)
  const falloEnCarga = useRef(false)
  return <MapaBase alto="100%" zoom={13} saltoZoom={0.1} controlZoom={false} eventosTeselas={{
    loading: () => { falloEnCarga.current = false },
    tileerror: () => { falloEnCarga.current = true; setFallo(true) },
    load: () => setFallo(falloEnCarga.current),
  }}>
    <ContenidoMapa fallo={fallo} />
  </MapaBase>
}
