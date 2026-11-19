import { useState } from 'react'
import { useMap, CircleMarker, Popup } from 'react-leaflet'
import Icono from '../components/ui/Icono'
export default function ControlesMapa() {
  const map = useMap(),
    [ubicacion, setUbicacion] = useState<[number, number] | null>(null),
    [mensaje, setMensaje] = useState(''),
    [cargando, setCargando] = useState(false)
  function localizar() {
    if (!navigator.geolocation) {
      setMensaje(
        'Tu navegador no admite ubicación. Selecciona el origen manualmente.',
      )
      return
    }
    setCargando(true)
    setMensaje('Solicitando ubicación…')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const punto: [number, number] = [p.coords.latitude, p.coords.longitude]
        setUbicacion(punto)
        map.setView(punto, 15)
        setCargando(false)
        setMensaje('Ubicación encontrada.')
      },
      () => {
        setCargando(false)
        setMensaje(
          'No se pudo acceder a tu ubicación. Puedes elegir el origen manualmente.',
        )
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }
  return (
    <>
      {ubicacion && (
        <CircleMarker
          center={ubicacion}
          radius={8}
          pathOptions={{
            color: '#855400',
            fillColor: '#ffb95c',
            fillOpacity: 1,
          }}
        >
          <Popup>Tu ubicación aproximada</Popup>
        </CircleMarker>
      )}
      <div className="controles-mapa">
        <button
          className="icon-button"
          onClick={localizar}
          disabled={cargando}
          aria-label="Usar mi ubicación"
        >
          <Icono nombre="ubicacion" />
        </button>
        <button
          className="icon-button"
          onClick={() => map.zoomIn()}
          aria-label="Acercar mapa"
        >
          <Icono nombre="mas" />
        </button>
        <button
          className="icon-button"
          onClick={() => map.zoomOut()}
          aria-label="Alejar mapa"
        >
          <Icono nombre="menos" />
        </button>
      </div>
      {mensaje && (
        <p className="mapa-mensaje" role="status">
          {mensaje}
        </p>
      )}
    </>
  )
}
