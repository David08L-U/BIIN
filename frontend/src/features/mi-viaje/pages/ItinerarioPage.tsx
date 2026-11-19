import { marcaActualizacion } from '../../../utils/formato'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { actividades, buscarDestino } from '../../../services/catalogo'
import type { Plan } from '../../../types/catalogo'
import { usePlanes } from '../usePlanes'
import { tiempoTotal, programar } from '../planificador'
import {
  fechaLocal,
  duracion,
  horaDeMinutos,
  minutosDeHora,
} from '../../../utils/formato'
import { descargarPlan } from '../../../offline/descargarPlan'
import CabeceraPagina from '../../../components/ui/CabeceraPagina'
import Icono from '../../../components/ui/Icono'
import EstadoVacio from '../../../components/ui/EstadoVacio'
export default function ItinerarioPage() {
  const { id } = useParams(),
    [params] = useSearchParams(),
    d = buscarDestino(id),
    { planes, guardar, error } = usePlanes(),
    [mensaje, setMensaje] = useState('')
  const [creadoEn] = useState(() => marcaActualizacion())
  if (!d)
    return (
      <section className="pagina">
        <EstadoVacio titulo="Itinerario no disponible">
          <Link to="/rutas">Elegir destino</Link>
        </EstadoVacio>
      </section>
    )
  const existente = planes.find(
    (p) => p.id === params.get('plan') && p.destinoId === id,
  )
  if (params.get('plan') && !existente)
    return (
      <section className="pagina">
        <EstadoVacio titulo="Este borrador no está en tu dispositivo">
          <Link to={`/personalizar/${d.id}`}>Crear mi itinerario</Link>
        </EstadoVacio>
      </section>
    )
  const sugeridas = actividades
    .filter((a) => a.destinoId === id)
    .filter(
      (a) =>
        id !== 'izamal' ||
        [
          'izamal-convento',
          'izamal-kinich',
          'izamal-piramide',
          'izamal-semilla',
        ].includes(a.id),
    )
    .slice(0, 4)
  const p: Plan = existente ?? {
    id: `sugerido-${d.id}`,
    destinoId: d.id,
    fecha: fechaLocal(),
    inicio: d.llegada,
    limite: 270,
    actividades: sugeridas.map((a) => a.id),
    actualizadoEn: creadoEn,
  }
  const lista = p.actividades
      .map((a) => actividades.find((x) => x.id === a && x.destinoId === id))
      .filter((a) => a !== undefined),
    horarios = programar(lista, p.inicio),
    fin = horaDeMinutos(minutosDeHora(p.inicio) + p.limite),
    personalizar = `/personalizar/${d.id}${existente ? `?plan=${p.id}` : ''}`
  function mover(i: number, delta: number) {
    const ids = [...p.actividades]
    ;[ids[i], ids[i + delta]] = [ids[i + delta], ids[i]]
    if (
      guardar({
        ...p,
        actividades: ids,
        actualizadoEn: marcaActualizacion(),
      })
    )
      setMensaje('Orden del borrador actualizado.')
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(
        `BIIN · ${d!.nombre} · ${p.fecha}\n${horarios.map((h) => `${h.desde}–${h.hasta}: ${h.actividad.titulo}`).join('\n')}\nDatos del prototipo sin validar. Sin reserva de asientos.`,
      )
      setMensaje('Resumen copiado.')
    } catch {
      setMensaje(
        'No se pudo copiar el resumen. Puedes descargarlo como archivo.',
      )
    }
  }
  return (
    <section className="pagina itinerario-page">
      <CabeceraPagina
        titulo={`Tu itinerario en ${d.nombre}`}
        subtitulo="BIIN ESCAPADAS"
        volver={`/rutas/${d.id}`}
        acciones={
          <button
            className="icon-button"
            onClick={copiar}
            aria-label="Copiar resumen del itinerario"
          >
            <Icono nombre="compartir" />
          </button>
        }
      />
      <div className="itinerario-grid">
        <div>
          <div className="tarjeta banda-tiempo">
            <span>
              <Icono nombre="reloj" />
              {existente
                ? 'Tu visita personalizada'
                : 'Recorrido sugerido'} · {p.fecha}
            </span>
            <span className="badge badge-ambar">
              {duracion(tiempoTotal(lista))} estimadas
            </span>
          </div>
          <div className="tarjeta conexion-van">
            <div className="fila">
              <span className="badge">CONEXIÓN VAN BIIN</span>
              <small>Mérida · {d.nombre}</small>
            </div>
            <p className="eyebrow">INICIO DE LA VISITA</p>
            <h2>
              {p.inicio} · {d.nombre} Centro
            </h2>
            <p className="muted">
              Horario elegido para planear, sujeto a la llegada de tu
              transporte.
            </p>
            <p className="texto-ambar">
              Margen libre: {duracion(p.limite - tiempoTotal(lista))}
            </p>
            <p className="eyebrow">FIN DE ESTANCIA</p>
            <h2>{fin} · Regreso al paradero</h2>
            <p className="muted">
              Confirma el último servicio con el operador. No hay asientos
              apartados.
            </p>
          </div>
          <div className="fila paso-cabecera">
            <h2>Paso a paso a tu ritmo</h2>
            <span>{lista.length} paradas</span>
          </div>
          <ol className="linea-actividades">
            {horarios.map(({ actividad: a, desde, hasta }, i) => (
              <li key={a.id}>
                <span className="actividad-numero">{i + 1}</span>
                <article className="tarjeta">
                  <div className="fila">
                    <small>
                      {desde} — {hasta}
                    </small>
                    <span className="badge">{a.categoria}</span>
                  </div>
                  <p className="badge traslado">
                    {a.traslado} min de traslado estimado
                  </p>
                  <h2>{a.titulo}</h2>
                  <p>{a.descripcion}</p>
                  <span className="texto-ambar">{a.acceso}</span>
                  {a.foto && <img src={a.foto} alt={a.titulo} loading="lazy" />}
                  {existente && (
                    <div className="reordenar">
                      <button
                        disabled={i === 0}
                        onClick={() => mover(i, -1)}
                        aria-label={`Subir ${a.titulo}`}
                      >
                        Subir
                      </button>
                      <button
                        disabled={i === lista.length - 1}
                        onClick={() => mover(i, 1)}
                        aria-label={`Bajar ${a.titulo}`}
                      >
                        Bajar
                      </button>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ol>
          <div className="tarjeta cierre-ruta">
            <Icono nombre="comprobar" />
            <p>
              <strong>
                {horaDeMinutos(minutosDeHora(fin) - 30)} · Volver al paradero
              </strong>
              <br />
              Reserva al menos 30 minutos para organizar el regreso.
            </p>
          </div>
        </div>
        <aside>
          <div className="tarjeta consejos">
            <h2>Consejos de viaje BIIN</h2>
            <Icono nombre="sol" />
            <h3>Protección y descanso</h3>
            <p>
              Lleva agua, calzado cómodo y confirma las condiciones de cada
              visita.
            </p>
            <Icono nombre="dinero" />
            <h3>Efectivo disponible</h3>
            <p>
              Consulta precios y medios de pago antes de visitar los
              establecimientos.
            </p>
          </div>
          <div className="acciones-itinerario">
            {!existente && (
              <button
                className="boton boton--primario"
                onClick={() => {
                  if (guardar({ ...p, actualizadoEn: marcaActualizacion() }))
                    setMensaje(
                      'Recorrido sugerido guardado en este dispositivo.',
                    )
                }}
              >
                <Icono nombre="guardar" />
                Guardar en mi dispositivo
              </button>
            )}
            <Link className="boton boton--secundario" to={personalizar}>
              <Icono nombre="ajustes" />
              Personalizar
            </Link>
            <button
              className="boton boton--secundario"
              onClick={() => {
                descargarPlan(p, d, lista)
                setMensaje('Archivo preparado para descargar.')
              }}
            >
              <Icono nombre="descargar" />
              Descargar itinerario
            </button>
            <p className="muted">
              {existente
                ? `Actualizado: ${new Date(p.actualizadoEn).toLocaleString('es-MX')}`
                : 'Vista sugerida de demostración.'}{' '}
              Sin sincronización de cuenta.
            </p>
            {(mensaje || error) && <p role="status">{error || mensaje}</p>}
          </div>
        </aside>
      </div>
    </section>
  )
}
