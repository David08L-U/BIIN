import { useNavigate } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { detalleTiculPrototipo as detalle } from '../data/detalleTiculPrototipo'
import { useBorradorTicul } from '../../mi-viaje/hooks/useBorradorTicul'
import { cambiarModalidadTicul, urlBorradorTicul } from '../../mi-viaje/plan/borradorTicul'
import DetalleDestino from '../components/DetalleDestino'

export default function DetalleTiculPage({ ruta }: { ruta: RutaPrototipo }) {
  const { borrador, actualizar } = useBorradorTicul()
  const navegar = useNavigate()

  return <DetalleDestino
    ruta={ruta}
    estancia={borrador.configuracion.estancia}
    cambiarEstancia={valor => actualizar(cambiarModalidadTicul(borrador, valor))}
    abrirItinerario={modo => navegar(urlBorradorTicul(modo === 'recomendado' ? 'itinerario' : 'personalizar', { ...borrador, modo, generado: false }))}
    detalle={{
      ...detalle,
      opciones: detalle.estancias,
      corredor: detalle.referenciaMapa,
      tiempo: `Duración aproximada · ~${ruta.tiempo}`,
      notaRecorrido: detalle.corredor,
      altCultural: 'Parroquia de San Antonio de Padua en Ticul',
      leyenda: 'Estancia o modalidad',
      tituloPrecio: 'Tarifa por pasaje',
      notaMapa: 'Mapa ilustrativo · Sin verificar',
      notaPrecio: 'Medios de pago sin confirmar',
      distintivo: 'Top Destino del Sur',
      etiquetaLugares: 'Lugares destacados de Ticul',
      notaDatos: 'Tarifa, duración y recorrido por confirmar.',
    }}
  />
}
