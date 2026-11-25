import { useNavigate } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { detalleValladolidPrototipo as detalle } from '../data/detalleValladolidPrototipo'
import { useBorradorValladolid } from '../../mi-viaje/hooks/useBorradorValladolid'
import { cambiarEstanciaValladolid, urlBorradorValladolid } from '../../mi-viaje/plan/borradorValladolid'
import DetalleDestino from '../components/DetalleDestino'

export default function DetalleValladolidPage({ ruta }: { ruta: RutaPrototipo }) {
  const { borrador, actualizar } = useBorradorValladolid()
  const navegar = useNavigate()

  return <DetalleDestino<(typeof detalle.estancias)[number]['id']>
    ruta={ruta}
    estancia={borrador.configuracion.estancia}
    cambiarEstancia={valor => actualizar(cambiarEstanciaValladolid(borrador, valor))}
    abrirItinerario={modo => navegar(urlBorradorValladolid(modo === 'recomendado' ? 'itinerario' : 'personalizar', { ...borrador, modo, generado: false }))}
    detalle={{
      ...detalle,
      opciones: detalle.estancias,
      corredor: detalle.carretera,
      tiempo: `~${ruta.tiempo}`,
      referenciaCultural: 'Calzada de los Frailes · Cenote Zací · Gastronomía Colonial',
      altCultural: 'Convento San Bernardino de Valladolid, imagen cultural del prototipo',
      leyenda: 'Tiempo disponible estimado',
      tituloPrecio: 'Tarifa',
      altMapa: 'Mapa ilustrativo de Mérida a Valladolid del prototipo',
      notaMapa: 'Distancia sin validar',
      notaDatos: '\n        Datos del prototipo, pendientes de validar y sin fecha de validación: tarifa, duración, recorrido y referencias. Horarios, andén y distancia sin confirmar.\n      ',
    }}
  />
}
