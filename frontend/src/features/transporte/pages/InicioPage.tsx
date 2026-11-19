import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CircleMarker, Popup, Tooltip } from 'react-leaflet'
import MapaBase from '../../../maps/MapaBase'
import BuscadorCabecera from '../components/BuscadorCabecera'
import { destinos } from '../../../services/catalogo'
import Icono from '../../../components/ui/Icono'
export default function InicioPage() {
  const [busqueda, setBusqueda] = useState(''),
    navegar = useNavigate()
  return (
    <section className="inicio-page">
      <div className="inicio-mapa">
        <MapaBase>
          <CircleMarker
            center={[20.9615, -89.6185]}
            radius={12}
            pathOptions={{
              color: '#2b1810',
              weight: 4,
              fillColor: '#ffb95c',
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="bottom">
              Terminal Noreste
            </Tooltip>
            <Popup>
              <Link to="/rutas">Ver rutas desde Mérida</Link>
            </Popup>
          </CircleMarker>
          <CircleMarker
            center={[20.9611, -89.6259]}
            radius={9}
            pathOptions={{
              color: '#2b1810',
              fillColor: 'white',
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="bottom">
              Parque San Juan
            </Tooltip>
          </CircleMarker>
        </MapaBase>
      </div>
      <form
        className="inicio-buscador"
        onSubmit={(e) => {
          e.preventDefault()
          navegar(`/rutas?q=${encodeURIComponent(busqueda)}`)
        }}
      >
        <BuscadorCabecera valor={busqueda} cambiar={setBusqueda} />
        {busqueda && (
          <button
            className="boton boton--primario buscar-resultados"
            type="submit"
          >
            Buscar destinos
          </button>
        )}
      </form>
      <div className="inicio-panel">
        <span className="tirador" />
        <span className="eyebrow">BIIN · MOVILIDAD REGIONAL</span>
        <h1>¿A dónde viajaremos hoy?</h1>
        <p>Explora las rutas y encuentra tu próxima parada</p>
        <div className="inicio-acciones">
          <Link className="boton boton--primario" to="/rutas">
            <Icono nombre="ruta" />
            Rutas
          </Link>
          <Link className="boton boton--secundario" to="/recorridos">
            <Icono nombre="calendario" />
            Itinerario
          </Link>
        </div>
        <div className="inicio-destinos">
          <p className="eyebrow">TU PRÓXIMA ESCAPADA</p>
          {destinos.slice(0, 3).map((d) => (
            <Link key={d.id} to={`/rutas/${d.id}`}>
              <span className="icono-caja">
                <Icono nombre={d.icono} />
              </span>
              <span>
                <strong>{d.nombre}</strong>
                <small>{d.etiqueta}</small>
              </span>
              <Icono nombre="flecha" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
