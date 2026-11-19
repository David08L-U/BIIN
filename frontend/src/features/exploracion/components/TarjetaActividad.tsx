import type { Actividad } from '../../../types/catalogo'
import { duracion } from '../../../utils/formato'
import Icono from '../../../components/ui/Icono'
export default function TarjetaActividad({
  actividad: a,
  seleccionada,
  cambiar,
}: {
  actividad: Actividad
  seleccionada?: boolean
  cambiar?: (id: string) => void
}) {
  return (
    <article
      className={`tarjeta tarjeta-actividad ${seleccionada ? 'elegida' : ''}`}
    >
      {a.foto && (
        <img
          className="actividad-foto"
          src={a.foto}
          alt={a.titulo}
          loading="lazy"
        />
      )}
      <div className="actividad-cuerpo">
        {cambiar ? (
          <label className="actividad-check">
            <input
              type="checkbox"
              checked={seleccionada}
              onChange={() => cambiar(a.id)}
            />
            <span>
              <strong>{a.titulo}</strong>
              <small className="texto-ambar">{a.categoria}</small>
            </span>
          </label>
        ) : (
          <h3>{a.titulo}</h3>
        )}
        <p>{a.descripcion}</p>
        <div className="actividad-meta">
          <span>
            <Icono nombre="reloj" />
            {duracion(a.minutos)}
          </span>
          <span>{a.traslado} min de traslado</span>
          <span>{a.acceso}</span>
        </div>
      </div>
    </article>
  )
}
