import { useNavigate } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { detalleHomunPrototipo as detalle } from '../data/detalleHomunPrototipo'
import { useBorradorHomun } from '../../mi-viaje/hooks/useBorradorHomun'
import { cambiarEstanciaHomun, urlBorradorHomun } from '../../mi-viaje/plan/borradorHomun'
import DetalleDestino from '../components/DetalleDestino'

export default function DetalleHomunPage({ ruta }: { ruta: RutaPrototipo }) {
  const { borrador, actualizar } = useBorradorHomun()
  const navegar = useNavigate()

  return <DetalleDestino<(typeof detalle.estancias)[number]['id']>
    ruta={ruta}
    estancia={borrador.configuracion.estancia}
    cambiarEstancia={valor => actualizar(cambiarEstanciaHomun(borrador, valor))}
    abrirItinerario={modo => navegar(urlBorradorHomun(modo === 'recomendado' ? 'itinerario' : 'personalizar', { ...borrador, modo, generado: false }))}
    detalle={{
      ...detalle,
      opciones: detalle.estancias,
      corredor: detalle.corredor,
      tiempo: `~${ruta.tiempo}`,
      altCultural: 'Paisaje de cenotes y naturaleza de Homún',
      leyenda: 'Tiempo disponible estimado',
      tituloPrecio: 'Pasaje',
      etiquetaLugares: 'Lugares destacados de Homún',
      notaDatos: 'Tarifa, duración y recorrido por confirmar. Salida, horarios y disponibilidad sin confirmar.',
    }}
  />
}
