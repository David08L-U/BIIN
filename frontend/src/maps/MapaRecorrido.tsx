import { useEffect } from 'react'
import { CircleMarker,Polyline,Popup,useMap } from 'react-leaflet'
import type { Parada } from '../types/catalogo'
import MapaBase from './MapaBase'
function Ajustar({paradas}:{paradas:Parada[]}){const map=useMap();useEffect(()=>{if(paradas.length)map.fitBounds(paradas.map(p=>p.coordenadas),{padding:[24,24]})},[map,paradas]);return null}
export default function MapaRecorrido({paradas}:{paradas:Parada[]}){
 return <div className="recorrido-mapa"><MapaBase alto="230px" controles={false}><Ajustar paradas={paradas}/><Polyline positions={paradas.map(p=>p.coordenadas)} pathOptions={{color:'#cc810b',weight:4,dashArray:'7 8'}}/>{paradas.map((p,i)=><CircleMarker key={p.nombre} center={p.coordenadas} radius={7} pathOptions={{color:'#2b1810',fillColor:i===paradas.length-1?'#ffb95c':'white',fillOpacity:1}}><Popup><strong>{p.nombre}</strong><br/>{p.referencia}</Popup></CircleMarker>)}</MapaBase><small className="mapa-etiqueta">Trazado ilustrativo · No es navegación vial</small></div>
}
