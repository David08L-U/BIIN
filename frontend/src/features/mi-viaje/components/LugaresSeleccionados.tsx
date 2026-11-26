interface SeleccionVisita { id: string; nombre: string; dia?: number }

/** Controles explícitos de edición de la selección del borrador (nunca del catálogo). */
export default function LugaresSeleccionados({
  lugares, jornadas = 1, onQuitar, onCambiarDia,
}: {
  lugares: SeleccionVisita[]
  jornadas?: number
  onQuitar: (id: string) => void
  onCambiarDia?: (id: string, dia: number) => void
}) {
  return <section className="iz-lugares-seleccionados" aria-labelledby="seleccion-itinerario-titulo">
    <h2 id="seleccion-itinerario-titulo">Lugares del recorrido</h2>
    {lugares.length ? <ul>{lugares.map(lugar => <li key={lugar.id}>
      <span>{lugar.nombre}</span>
      {jornadas > 1 && onCambiarDia && <label>Jornada de {lugar.nombre}<select value={lugar.dia ?? 1} onChange={e => onCambiarDia(lugar.id, Number(e.target.value))}><option value={1}>Día 1</option><option value={2}>Día 2</option></select></label>}
      <button type="button" className="iz-plan-restablecer" aria-label={`Quitar ${lugar.nombre} del itinerario`} onClick={() => onQuitar(lugar.id)}>Quitar</button>
    </li>)}</ul> : <p role="status">Aún no hay lugares seleccionados. El recorrido se puede generar vacío.</p>}
  </section>
}
