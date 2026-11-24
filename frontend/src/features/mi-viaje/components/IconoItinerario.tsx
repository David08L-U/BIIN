export default function IconoItinerario({ nombre, tamano = 18 }: { nombre: string; tamano?: number }) {
  return <span className="biin-icon" aria-hidden="true" style={{ fontSize: tamano }}>{nombre}</span>
}
