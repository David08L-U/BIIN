import { useState,type ReactNode } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import ControlesMapa from './ControlesMapa'
interface MapaBaseProps{centro?:LatLngExpression;zoom?:number;alto?:string;children?:ReactNode;controles?:boolean}
export default function MapaBase({centro=[20.966,-89.62],zoom=14,alto='100%',children,controles=true}:MapaBaseProps){
 const [fallo,setFallo]=useState(false)
 return <div className="mapa-base" style={{height:alto}}><MapContainer center={centro} zoom={zoom} style={{height:'100%',width:'100%'}} scrollWheelZoom={false} zoomControl={false}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{tileerror:()=>setFallo(true)}}/>{children}{controles&&<ControlesMapa/>}</MapContainer>{fallo&&<div className="mapa-fallo" role="status">No se pudo cargar parte del mapa. Revisa tu conexión; los datos de la ruta siguen disponibles.</div>}</div>
}
