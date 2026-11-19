import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { destinos, actividades } from '../../../services/catalogo'
import { normalizar } from '../../../utils/formato'
import CabeceraPagina from '../../../components/ui/CabeceraPagina'
export default function AsistentePage() {
  const [q, setQ] = useState(''),
    [consulta, setConsulta] = useState('')
  const termino = normalizar(consulta),
    porDestino = destinos.filter((d) => termino.includes(normalizar(d.nombre)))
  const interes = termino.includes('cenot')
    ? 'Cenotes'
    : termino.includes('com') || termino.includes('gastronom')
      ? 'Gastronomía'
      : termino.includes('taller') || termino.includes('artesan')
        ? 'Talleres'
        : termino.includes('cultur')
          ? 'Cultura'
          : null
  const coincidencias = actividades.filter(
    (a) =>
      (!porDestino.length || porDestino.some((d) => d.id === a.destinoId)) &&
      (!interes || a.categoria === interes) &&
      (porDestino.length > 0 || interes !== null),
  )
  function enviar(e: FormEvent) {
    e.preventDefault()
    setConsulta(q.trim())
  }
  return (
    <section className="pagina asistente-page">
      <CabeceraPagina
        titulo="Asistente BIIN"
        subtitulo="ENCUENTRA TU PRÓXIMA PARADA"
      />
      <div className="tarjeta">
        <h2>¿Qué te gustaría conocer?</h2>
        <p>
          Búsqueda guiada del prototipo. La inteligencia artificial está
          pendiente de integrar; estas sugerencias provienen del catálogo de
          demostración.
        </p>
        <form onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="pregunta">Cuéntanos tu plan</label>
            <textarea
              id="pregunta"
              rows={4}
              maxLength={500}
              placeholder="Quiero conocer cenotes en Homún"
              required
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="boton boton--primario">Buscar en BIIN</button>
        </form>
      </div>
      {consulta && (
        <div className="tarjeta respuesta-asistente" role="status">
          <h2>
            {coincidencias.length
              ? 'Opciones del prototipo'
              : 'No tengo esa información'}
          </h2>
          {!coincidencias.length ? (
            <p>
              No hay suficientes coincidencias en el catálogo. Prueba un destino
              o interés como cenotes, cultura, comida o talleres.
            </p>
          ) : (
            <>
              <p>
                Consulta condiciones, horarios y precios con los responsables
                antes de viajar.
              </p>
              <ul>
                {coincidencias.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <strong>{a.titulo}</strong>
                    <p>{a.descripcion}</p>
                    <Link to={`/rutas/${a.destinoId}`}>Ver destino</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  )
}
