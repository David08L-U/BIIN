import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { detalleTekitPrototipo as detalle } from '../data/detalleTekitPrototipo'
import { useBorradorTekit } from '../../mi-viaje/hooks/useBorradorTekit'
import { cambiarModalidadTekit, urlBorradorTekit } from '../../mi-viaje/plan/borradorTekit'
import DetalleDestino from '../components/DetalleDestino'

export default function DetalleTekitPage({ ruta }: { ruta: RutaPrototipo }) {
  const { borrador, actualizar } = useBorradorTekit()
  const navegar = useNavigate()
  const [mostrarReferencia, setMostrarReferencia] = useState(false)
  const referenciaSalida = <>
    <button type="button" className="izamal-boton-icono" aria-label="Ver referencia de salida de Tekit" aria-expanded={mostrarReferencia} aria-controls="tekit-referencia-salida" onClick={() => setMostrarReferencia(valor => !valor)}>
      <span className="biin-icon" aria-hidden="true">near_me</span>
    </button>
    <div id="tekit-referencia-salida" role="region" aria-label="Referencia de salida de Tekit" hidden={!mostrarReferencia}>
      <p>Terminal de referencia: {detalle.terminal}. {detalle.referenciaTerminal}. Andén y horarios por confirmar. No representa tu ubicación ni ofrece indicaciones GPS.</p>
    </div>
  </>

  return <DetalleDestino
    ruta={ruta}
    estancia={borrador.configuracion.estancia}
    cambiarEstancia={valor => actualizar(cambiarModalidadTekit(borrador, valor))}
    abrirItinerario={modo => navegar(urlBorradorTekit(modo === 'recomendado' ? 'itinerario' : 'personalizar', { ...borrador, modo, generado: false }))}
    referenciaSalida={referenciaSalida}
    detalle={{
      ...detalle,
      opciones: detalle.opciones.filter(opcion => opcion.id !== 'ruta-textil' || borrador.configuracion.estancia === 'ruta-textil').map(opcion => ({ ...opcion, duracion: opcion.detalle })),
      corredor: detalle.carretera,
      tiempo: `Tiempo estimado de viaje · ~${ruta.tiempo}`,
      referenciaCultural: 'Ruta Textil · Talleres de Bordado · Gastronomía Local',
      altCultural: 'Fotografía representativa de Tekit pendiente de verificar',
      leyenda: 'Estancia o modalidad de visita',
      tituloPrecio: 'Tarifa',
      notaPrecio: 'Por validar',
      etiquetaLugares: 'Lugares destacados de Tekit',
      notaDatos: 'Tarifa, duración y recorrido por confirmar. Salida, horarios, disponibilidad y medios de pago sin confirmar.',
    }}
  />
}
