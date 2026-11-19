import { Link } from 'react-router'
import type { Destino } from '../../../types/catalogo'
import Icono from '../../../components/ui/Icono'
import { moneda,duracion } from '../../../utils/formato'
export default function TarjetaDestino({destino:d}:{destino:Destino}){
 return <Link className="tarjeta-destino" to={`/rutas/${d.id}`} aria-label={`Ver ruta a ${d.nombre}`}><div className="destino-cuerpo"><span className="icono-caja"><Icono nombre={d.icono}/></span><div><div className="destino-titulo"><h2>{d.nombre}</h2><span className={`badge ${d.id==='izamal'?'badge-ambar':''}`}>{d.etiqueta}</span></div><p>{d.lema}</p></div><span className="icon-button destino-ver"><Icono nombre="flecha"/></span></div><div className="destino-pie"><span><Icono nombre="reloj"/>{duracion(d.duracion)}</span><span><Icono nombre="ruta"/>c / {d.frecuencia} min</span><span className="destino-precio">Desde <strong>{moneda(d.precio)}</strong></span></div></Link>
}
