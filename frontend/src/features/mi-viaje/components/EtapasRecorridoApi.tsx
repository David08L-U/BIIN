import type { EtapaRecorrido } from '../../recorridos/types'
import FotografiaPublicada from '../../../components/ui/FotografiaPublicada'
import { duracionPlan } from '../plan/duracion'

export default function EtapasRecorridoApi({ etapas, seleccion, cambiar, personalizado, disabled }: {
  etapas: EtapaRecorrido[]; seleccion: number[]; cambiar: (seleccion: number[]) => void; personalizado: boolean; disabled: boolean
}) {
  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden)
  const elegidas = seleccion.map(orden => etapas.find(e => e.orden === orden)).filter((e): e is EtapaRecorrido => !!e)
  function mover(indice: number, paso: number) {
    const copia = [...seleccion]; [copia[indice], copia[indice + paso]] = [copia[indice + paso], copia[indice]]; cambiar(copia)
  }
  return <section className="plan-recorrido" aria-labelledby="etapas-titulo"><h2 id="etapas-titulo">{personalizado ? 'Elige tus actividades' : 'Recorrido sugerido'}</h2>
    <div className="plan-lista-lugares">{ordenadas.map(e => <article className="plan-tarjeta plan-lugar" key={e.orden}>
      <FotografiaPublicada src={e.fotoPrincipal} alt={e.titulo} />
      <h3>{e.titulo}</h3><p>{e.descripcion}</p><p>{e.tipo} · {e.localidad ?? 'Localidad sin confirmar'}</p>
      <p>{e.duracionSugeridaMin == null ? 'Duración sin confirmar' : `${duracionPlan(e.duracionSugeridaMin)} de visita sugerida`}</p>
      {!e.disponible && <p role="status">{e.aviso ?? 'Contenido no disponible.'}</p>}
      {personalizado && <label className="seleccion-api"><input type="checkbox" disabled={!e.disponible || disabled} checked={seleccion.includes(e.orden)} onChange={() => cambiar(seleccion.includes(e.orden) ? seleccion.filter(id => id !== e.orden) : [...seleccion, e.orden])} />Seleccionar {e.titulo}</label>}
    </article>)}</div>
    {personalizado && <section className="plan-tarjeta"><h3>Orden de visita</h3><ol>{elegidas.map((e, i) => <li key={e.orden} className="orden-api"><span>{e.titulo}</span><div><button type="button" aria-label={`Subir ${e.titulo}`} disabled={disabled || i === 0} onClick={() => mover(i, -1)}>↑</button><button type="button" aria-label={`Bajar ${e.titulo}`} disabled={disabled || i === seleccion.length - 1} onClick={() => mover(i, 1)}>↓</button></div></li>)}</ol>{!seleccion.length && <p>Selecciona al menos una actividad.</p>}</section>}
  </section>
}
