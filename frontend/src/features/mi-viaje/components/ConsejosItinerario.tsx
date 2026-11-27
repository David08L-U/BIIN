import Icono from './IconoItinerario'

export interface ConsejoViaje { icono: string; titulo: string; descripcion: string }

export default function ConsejosItinerario({ id, consejos }: { id: string; consejos: readonly ConsejoViaje[] }) {
  return <section className="iz-plan-consejos" aria-labelledby={id}>
    <h2 id={id}><Icono nombre="tips_and_updates" tamano={18} />Consejos de viaje BIIN</h2>
    <div>{consejos.map(consejo => <article className="iz-plan-tarjeta" key={consejo.titulo}>
      <Icono nombre={consejo.icono} tamano={20} />
      <h3>{consejo.titulo}</h3>
      <p>{consejo.descripcion}</p>
    </article>)}</div>
  </section>
}
