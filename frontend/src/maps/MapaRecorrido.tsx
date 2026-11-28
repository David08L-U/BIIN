import { useEffect } from 'react'
import { CircleMarker, Polyline, Popup, useMap } from 'react-leaflet'
import MapaBase from './MapaBase'

export interface CoordenadaPublicada { latitud: number; longitud: number; nombre?: string }
const valida = (p: CoordenadaPublicada) => Number.isFinite(p.latitud) && Number.isFinite(p.longitud) && Math.abs(p.latitud) <= 90 && Math.abs(p.longitud) <= 180

function Encuadre({ puntos }: { puntos: [number, number][] }) {
  const mapa = useMap()
  useEffect(() => { mapa.fitBounds(puntos, { padding: [24, 24], maxZoom: 15 }) }, [mapa, puntos])
  return null
}
/** El trazo solo se dibuja si la API lo devuelve; nunca une visitas como si fueran calles. RF03. */
export default function MapaRecorrido({ paradas, trazo = [] }: {
  paradas: CoordenadaPublicada[]; trazo?: CoordenadaPublicada[]
}) {
  const marcadores = paradas.filter(valida)
  const linea = trazo.filter(valida).map(p => [p.latitud, p.longitud] as [number, number])
  const puntos = [...marcadores.map(p => [p.latitud, p.longitud] as [number, number]), ...linea]
  if (!puntos.length) return <p role="status">No hay coordenadas publicadas para mostrar el mapa.</p>
  return <div className="mapa-publicado" role="region" aria-label="Mapa de ubicaciones publicadas">
    <MapaBase centro={puntos[0]} alto="var(--alto-mapa-publicado, 280px)" zoom={10}>
      <Encuadre puntos={puntos} />
      {linea.length > 1 && <Polyline positions={linea} pathOptions={{ color: '#805638' }} />}
      {marcadores.map((p, i) => <CircleMarker key={`${p.latitud}:${p.longitud}:${i}`} center={[p.latitud, p.longitud]} radius={7} pathOptions={{ color: '#593b26', fillOpacity: 0.9 }}><Popup>{i + 1}. {p.nombre ?? 'Ubicación publicada'}</Popup></CircleMarker>)}
    </MapaBase>
  </div>
}
