import { Link, useParams, useSearchParams } from 'react-router'
import { useConsultaApi } from '../../../hooks/useConsultaApi'
import EstadoConsulta from '../../../components/ui/EstadoConsulta'
import FotografiaPublicada from '../../../components/ui/FotografiaPublicada'
import { idPositivo } from '../../../utils/consultaApi'
import { fechaHora, moneda } from '../../../utils/formatoDatos'
import { contenidosApi, esTipoContenido } from '../api'
import AgregarContenidoApi from '../components/AgregarContenidoApi'
import { diasSemana } from '../../transporte/components/HorariosRuta'
import '../../../styles/explorar.css'
import '../../../styles/planificador.css'

export function ExplorarDetallePage() {
  const { tipo, id } = useParams()
  const numero = idPositivo(id)
  const consulta = useConsultaApi(`contenido:${tipo}:${id}`, signal => {
    if (!esTipoContenido(tipo) || numero === null) throw new Error('El contenido no es válido o el enlace corresponde al prototipo anterior. Busca el contenido publicado en Explorar.')
    return contenidosApi.obtener(tipo, numero, signal)
  })
  const contenido = consulta.datos
  const foto = contenido?.fotografias.slice().sort((a, b) => a.orden - b.orden)[0]
  return <section className="explorar iz-plan"><Link to="/explorar">← Volver a Explorar</Link><EstadoConsulta consulta={consulta} />{contenido && <article className="iz-plan-tarjeta explorar-detalle"><FotografiaPublicada src={foto?.urlArchivo} alt={foto?.textoAlternativo || contenido.titulo} /><p className="explorar-meta">{contenido.ubicacion.localidad} · {contenido.ubicacion.municipio}</p><h1>{contenido.titulo}</h1><p>{contenido.descripcion}</p><p>{contenido.ubicacion.direccionReferencia ?? 'Sin dirección de referencia publicada.'}</p><p>{contenido.categorias.map(c => c.nombre).join(' · ')}</p>
    {tipo === 'lugar' && <><p>Costo de acceso: {moneda(contenido.costoAcceso)}</p><p>{contenido.condicionesAcceso ?? 'Condiciones de acceso sin confirmar.'}</p></>}
    {tipo === 'negocio' && <p>Precios aproximados: {moneda(contenido.precioMinimoAprox)} a {moneda(contenido.precioMaximoAprox)}</p>}
    {tipo === 'evento' && <><p>{fechaHora(contenido.inicio)} → {fechaHora(contenido.fin)}</p><p>Estado: {contenido.estadoEvento?.replaceAll('_', ' ')} · Entrada: {moneda(contenido.costoEntrada)}</p></>}
    {contenido.horarios && <section><h2>Horarios publicados</h2>{contenido.horarios.length ? <ul>{contenido.horarios.map((h, i) => <li key={i}>{diasSemana[h.diaSemana]} · {h.horaApertura.slice(0, 5)} a {h.horaCierre.slice(0, 5)} (Yucatán)</li>)}</ul> : <p>Sin horarios confirmados.</p>}</section>}
    <p className="explorar-nota">Actualizado: {fechaHora(contenido.actualizadoEn)}</p><Link to={`/recorridos?localidad=${contenido.ubicacion.idLocalidad}`}>Planear visita en {contenido.ubicacion.localidad}</Link><AgregarContenidoApi idRecurso={contenido.idRecurso} />
  </article>}</section>
}
export default function ExplorarPage() {
  const [params, setParams] = useSearchParams()
  const busqueda = params.get('q') ?? ''
  const tipo = esTipoContenido(params.get('tipo') ?? undefined) ? params.get('tipo') as 'lugar' | 'negocio' | 'evento' : undefined
  const localidad = idPositivo(params.get('localidad')) ?? undefined
  const consulta = useConsultaApi(`explorar:${busqueda}:${tipo}:${localidad}`, signal => contenidosApi.listar({ busqueda, tipo, idLocalidad: localidad }, signal))
  function cambiar(clave: string, valor: string) { const nuevos = new URLSearchParams(params); if (valor) nuevos.set(clave, valor); else nuevos.delete(clave); setParams(nuevos, { replace: true }) }
  return <section className="explorar iz-plan"><header className="explorar-cabecera"><h1>Explorar lugares</h1><p>Descubre lugares, gastronomía y eventos publicados en BIIN.</p></header>
    <div className="explorar-filtros"><label>Buscar contenido<input type="search" value={busqueda} onChange={e => cambiar('q', e.target.value)} /></label><label>Tipo de contenido<select value={tipo ?? ''} onChange={e => cambiar('tipo', e.target.value)}><option value="">Todos</option><option value="lugar">Lugares</option><option value="negocio">Gastronomía</option><option value="evento">Eventos</option></select></label><button type="button" onClick={() => setParams({}, { replace: true })}>Limpiar filtros</button></div>
    <EstadoConsulta consulta={consulta} />{consulta.datos && <p role="status">{consulta.datos.length} contenidos encontrados</p>}
    <div className="explorar-grid">{consulta.datos?.map(r => <article className="iz-plan-tarjeta explorar-card" key={r.idRecurso}><p className="explorar-meta">{r.localidad} · {r.tipo}</p><h2>{r.titulo}</h2><p>{r.descripcion}</p><p>{r.categorias.join(' · ')}</p><p className="explorar-nota">Actualizado: {fechaHora(r.actualizadoEn)}</p><Link to={`/explorar/${r.tipo}/${r.idRecurso}`}>Ver detalle de {r.titulo}</Link></article>)}</div>
    {consulta.datos?.length === 0 && <p role="status">No hay contenidos publicados con esos filtros.</p>}
  </section>
}
