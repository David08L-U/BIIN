import { Link } from 'react-router'
import Icono from './IconoItinerario'

export default function EnlaceDetalleRuta({ to }: { to: string }) {
  return <Link className="iz-plan-enlace-detalle" to={to}>Ver detalle de ruta <Icono nombre="arrow_forward" tamano={14} /></Link>
}
