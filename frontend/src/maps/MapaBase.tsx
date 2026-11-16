import type { ReactNode } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { CENTRO_YUCATAN } from './constantes'

interface MapaBaseProps {
  centro?: LatLngExpression
  zoom?: number
  alto?: string
  children?: ReactNode
}

/** Mapa de OpenStreetMap que comparten todos los módulos. */
export default function MapaBase({ centro = CENTRO_YUCATAN, zoom = 9, alto = '60vh', children }: MapaBaseProps) {
  return (
    <MapContainer center={centro} zoom={zoom} style={{ height: alto, width: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  )
}
