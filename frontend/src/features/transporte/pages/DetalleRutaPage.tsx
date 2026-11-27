import { Link, useParams } from 'react-router'
import EstadoConsulta from '../../../components/ui/EstadoConsulta'
import DetalleRutaPublicada from '../components/DetalleRutaPublicada'
import { useDetalleRutaApi } from '../hooks/useDetalleRutaApi'

/** RF03: el identificador determina la consulta, nunca una página por pueblo. */
export default function DetalleRutaPage() {
  const { id = '' } = useParams()
  const consulta = useDetalleRutaApi(id)
  if (!consulta.datos?.ruta) return <section className="iz-plan"><h1>Detalle de ruta</h1><EstadoConsulta consulta={consulta} />
    {consulta.datos?.coincidencias.length ? <><p>Elige la ruta de transporte:</p><ul>{consulta.datos.coincidencias.map(r => <li key={r.idRuta}><Link to={`/rutas/${r.idRuta}`}>{r.titulo} · {r.origen} → {r.destino}</Link></li>)}</ul></> : null}<Link to="/rutas">Volver al catálogo de rutas</Link>
  </section>
  return <DetalleRutaPublicada key={consulta.datos.ruta.idRuta} ruta={consulta.datos.ruta} />
}
