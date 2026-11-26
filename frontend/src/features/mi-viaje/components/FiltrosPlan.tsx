import Icono from './IconoItinerario'

export default function FiltrosPlan<Id extends string>({ etiqueta, opciones, activo, seleccionar, contador }: {
  etiqueta: string
  opciones: readonly { id: Id; nombre: string; icono?: string }[]
  activo: Id
  seleccionar: (id: Id) => void
  contador?: (id: Id) => number
}) {
  return <div className="iz-plan-filtros" role="group" aria-label={etiqueta}>
    {opciones.map(({ id, nombre, icono }) => (
      <button type="button" key={id} aria-pressed={activo === id} onClick={() => seleccionar(id)}>
        {icono && <Icono nombre={icono} tamano={16} />}
        <span>{nombre}</span>
        {contador && <span className="iz-plan-contador">{contador(id)}</span>}
      </button>
    ))}
  </div>
}
