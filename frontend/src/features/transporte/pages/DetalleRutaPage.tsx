import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import RutaNoEncontrada from '../components/RutaNoEncontrada'
import DetalleDestino from '../components/DetalleDestino'
import { detalleParaEstancia, obtenerDestino } from '../../destinos/registroDestinos'

/** CU-03: una composición de detalle seleccionada por el identificador de ruta. */
export default function DetalleRutaPage() {
  const { id } = useParams()
  const destino = obtenerDestino(id)
  const [parametros, setParametros] = useSearchParams()
  const navegar = useNavigate()
  const [mostrarReferencia, setMostrarReferencia] = useState(false)

  if (!destino) return <RutaNoEncontrada />

  const estancia = destino.leerEstancia(parametros)
  const detalle = detalleParaEstancia(destino, estancia)
  const referenciaSalida = destino.tieneReferenciaSalida ? <>
    <button type="button" className="izamal-boton-icono" aria-label="Ver referencia de salida de Tekit"
      aria-expanded={mostrarReferencia} aria-controls="tekit-referencia-salida" onClick={() => setMostrarReferencia(valor => !valor)}>
      <span className="biin-icon" aria-hidden="true">near_me</span>
    </button>
    <div id="tekit-referencia-salida" role="region" aria-label="Referencia de salida de Tekit" hidden={!mostrarReferencia}>
      <p>Terminal de referencia: {detalle.terminal}. {detalle.referenciaTerminal}. Andén y horarios por confirmar. No representa tu ubicación ni ofrece indicaciones GPS.</p>
    </div>
  </> : undefined

  return <DetalleDestino
    key={destino.id}
    ruta={destino.ruta}
    detalle={detalle}
    estancia={estancia}
    referenciaSalida={referenciaSalida}
    cambiarEstancia={valor => setParametros(destino.cambiarEstancia(parametros, valor), { replace: true })}
    abrirItinerario={modo => navegar(destino.urlPlanificador(parametros, modo))}
  />
}
