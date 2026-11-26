import type { ReactNode } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import type { LatLngExpression, LeafletEventHandlerFnMap } from 'leaflet'
import { CENTRO_YUCATAN } from './constantes'

interface MapaBaseProps {
  centro?: LatLngExpression
  zoom?: number
  saltoZoom?: number
  alto?: string
  controlZoom?: boolean
  eventosTeselas?: LeafletEventHandlerFnMap
  children?: ReactNode
}

/** Mapa de OpenStreetMap que comparten todos los módulos. */
export default function MapaBase({ centro = CENTRO_YUCATAN, zoom = 9, saltoZoom = 1, alto = '60vh', controlZoom = true, eventosTeselas, children }: MapaBaseProps) {
  return (
    <MapContainer center={centro} zoom={zoom} zoomSnap={saltoZoom} zoomControl={controlZoom} style={{ height: alto, width: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        eventHandlers={eventosTeselas}
      />
      {children}
    </MapContainer>
  )
}
