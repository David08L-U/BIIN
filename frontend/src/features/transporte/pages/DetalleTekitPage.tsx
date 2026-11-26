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
      <p>Referencia del prototipo: {detalle.terminal}. {detalle.referenciaTerminal}. Andén y horarios sin confirmar. No representa tu ubicación ni ofrece indicaciones GPS.</p>
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
      opciones: detalle.opciones.map(opcion => ({ ...opcion, duracion: opcion.detalle })),
      corredor: detalle.carretera,
      tiempo: `Tiempo estimado de viaje · ~${ruta.tiempo}`,
      referenciaCultural: 'Ruta Textil · Talleres de Bordado · Gastronomía Local',
      altCultural: 'Taller textil de guayaberas de Tekit, imagen cultural del prototipo',
      leyenda: 'Estancia o modalidad de visita',
      tituloPrecio: 'Tarifa',
      notaPrecio: 'Por validar',
      etiquetaLugares: 'Lugares destacados del prototipo',
      notaDatos: 'Datos del prototipo, pendientes de validar y sin fecha de validación: tarifa, duración, trazado y referencias. Salida, disponibilidad, horarios y medios de pago sin confirmar.',
    }}
  />
}
