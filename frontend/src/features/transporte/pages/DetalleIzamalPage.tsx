import { useNavigate } from 'react-router'
import type { RutaPrototipo } from '../data/rutasPrototipo'
import { detalleIzamalPrototipo as detalle } from '../data/detalleIzamalPrototipo'
import { useBorradorIzamal } from '../../mi-viaje/hooks/useBorradorIzamal'
import { cambiarEstanciaIzamal, urlBorrador } from '../../mi-viaje/plan/borradorIzamal'
import type { EstanciaIzamal, ModoItinerario } from '../../mi-viaje/plan/itinerarioIzamal'

import DetalleDestino from '../components/DetalleDestino'

/** CU-03 / RF03: composición del HTML de Melanie, con datos no confirmados. */
export default function DetalleIzamalPage({ ruta }: { ruta: RutaPrototipo }) {
  const { borrador, actualizar } = useBorradorIzamal()
  const navegar = useNavigate()
  const estancia = borrador.configuracion.estancia

  function cambiarEstancia(valor: EstanciaIzamal) {
    actualizar({ configuracion: cambiarEstanciaIzamal(borrador.configuracion, valor) })
  }

  function abrirItinerario(modo: ModoItinerario) {
    navegar(urlBorrador(modo === 'recomendado' ? 'itinerario' : 'personalizar', { ...borrador, modo, generado: false }))
  }

  return <DetalleDestino ruta={ruta} estancia={estancia} cambiarEstancia={cambiarEstancia} abrirItinerario={abrirItinerario} detalle={{
    ...detalle,
    opciones: detalle.estancias.filter(opcion => opcion.id !== 'tarde-magica' || estancia === 'tarde-magica'),
    etiqueta: 'Ruta Directa Van',
    puebloMagico: true,
    descripcion: 'La Ciudad de las Tres Culturas · Yucatán',
    terminal: 'Terminal Noreste · Calle 67',
    referenciaTerminal: 'Mérida Centro Histórico',
    corredor: 'Trayecto Carretera Mérida-Tixkokob-Izamal',
    referenciaCultural: 'Convento Franciscano · Pirámide Kinich Kakmó · Gastronomía',
    altCultural: 'Atrio y arcadas amarillas del convento de San Antonio de Padua en Izamal',
    etiquetaCultural: 'Pueblo Mágico Amarillo',
    notaDatos: 'Tarifa y recorrido por confirmar.',
    notaRecorrido: `El detalle original indica ${detalle.tiempo}; el catálogo, ${ruta.tiempo}. Tiempos pendientes de validar. El origen es ilustrativo; no representa tu ubicación.`,
    notaRegreso: 'Horarios y opciones de regreso: sin confirmar. Verifica con la terminal antes de viajar.',
  }} />
}
