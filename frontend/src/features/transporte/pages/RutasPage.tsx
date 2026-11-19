import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { destinos } from '../../../services/catalogo'
import BuscadorCabecera from '../components/BuscadorCabecera'
import TarjetaDestino from '../components/TarjetaDestino'
import { filtrarDestinos, type FiltroRuta } from '../filtrarDestinos'
import EstadoVacio from '../../../components/ui/EstadoVacio'
import Icono from '../../../components/ui/Icono'
export default function RutasPage() {
  const [params, setParams] = useSearchParams(),
    [filtro, setFiltro] = useState<FiltroRuta>('todas'),
    [origen, setOrigen] = useState('merida')
  const q = params.get('q') ?? '',
    lista = filtrarDestinos(destinos, q, filtro, origen)
  return (
    <section className="pagina rutas-page">
      <BuscadorCabecera
        valor={q}
        cambiar={(valor) =>
          setParams(valor ? { q: valor } : {}, { replace: true })
        }
      />
      <div className="titulo-bloque">
        <h1>¿A dónde viajaremos hoy?</h1>
        <p>Salidas frecuentes y combis colectivas desde Mérida</p>
      </div>
      <label className="origen">
        <Icono nombre="pin" />
        Origen
        <select value={origen} onChange={(e) => setOrigen(e.target.value)}>
          <option value="merida">Mérida</option>
          <option value="otro">Otra localidad</option>
        </select>
      </label>
      <div className="chips" aria-label="Filtrar rutas">
        {(
          [
            ['todas', 'ruta', 'Todas las rutas'],
            ['directos', 'bus', 'Directos'],
            ['cenotes', 'agua', 'Ruta Cenotes'],
          ] as const
        ).map(([id, icono, titulo]) => (
          <button
            key={id}
            className={`chip ${filtro === id ? 'activo' : ''}`}
            aria-pressed={filtro === id}
            onClick={() => setFiltro(id)}
          >
            <Icono nombre={icono} />
            {titulo}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {lista.length} rutas encontradas
      </p>
      <div className="lista-destinos">
        {lista.map((d) => (
          <TarjetaDestino key={d.id} destino={d} />
        ))}
      </div>
      {!lista.length && (
        <EstadoVacio titulo="No encontramos rutas">
          {destinos.length
            ? 'Prueba otro destino, cambia los filtros o selecciona Mérida como origen.'
            : 'El equipo aún no ha publicado rutas validadas.'}
        </EstadoVacio>
      )}
      <div className="tarjeta nota-terminal">
        <span className="icono-caja">
          <Icono nombre="pin" />
        </span>
        <div>
          <strong>Salidas principales: Parque San Juan y Noreste</strong>
          <p>
            Consulta el paradero al seleccionar tu destino. Los valores
            mostrados son del prototipo.
          </p>
        </div>
      </div>
    </section>
  )
}
