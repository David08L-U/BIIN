import { latLng, type LatLngTuple, type Map } from 'leaflet'

// Encuadre de entorno inmediato: 450 m de radio (aprox. 900 m de extremo a extremo).
const radioMetros = 450

export function limitesUbicacion(punto: LatLngTuple) {
  return latLng(punto).toBounds(radioMetros * 2)
}

export function encuadrarUbicacion(mapa: Map, punto: LatLngTuple) {
  const { bottom, height } = mapa.getContainer().getBoundingClientRect()
  const barra = document.querySelector('.biin-nav')?.getBoundingClientRect()
  const recorteInferior = barra ? Math.max(0, bottom - barra.top) : 0
  // El panel inferior está en el flujo. Dentro del mapa quedan el buscador,
  // los avisos y la atribución. En pantallas bajas la barra puede solaparse.
  mapa.fitBounds(limitesUbicacion(punto), {
    paddingTopLeft: [12, Math.min(72, height / 4)],
    paddingBottomRight: [12, Math.min(48 + recorteInferior, height / 3)],
    animate: false,
  })
}
