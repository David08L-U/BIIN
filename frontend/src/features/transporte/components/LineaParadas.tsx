import type { Parada } from '../../../types/catalogo'
export default function LineaParadas({paradas}:{paradas:Parada[]}){
 return <ol className="linea-paradas">{paradas.map((p,i)=><li key={p.nombre} className={i===paradas.length-1?'destino-final':''}><span className="parada-punto"/><div><strong>{p.nombre}</strong>{i===0&&<span className="badge">Abordaje</span>}{i===paradas.length-1&&<span className="badge badge-ambar">Destino</span>}<p>{p.referencia}</p></div></li>)}</ol>
}
