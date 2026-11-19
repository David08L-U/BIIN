import type { Destino } from '../../types/catalogo'
import { normalizar } from '../../utils/formato'
export type FiltroRuta='todas'|'directos'|'cenotes'
export function filtrarDestinos(datos:Destino[],busqueda:string,filtro:FiltroRuta,origen='merida'){
 if(origen!=='merida')return []
 const termino=normalizar(busqueda)
 return datos.filter(d=>(filtro!=='directos'||d.directo)&&(filtro!=='cenotes'||d.cenotes)&&normalizar(`${d.nombre} ${d.lema}`).includes(termino))
}
