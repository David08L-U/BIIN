import { Link } from 'react-router'
import FotografiaPublicada from '../../../components/ui/FotografiaPublicada'
import MapaRecorrido from '../../../maps/MapaRecorrido'
import { fechaHora, moneda } from '../../../utils/formatoDatos'
import type { RutaDetalle } from '../types'
import { ordenarParadas, tarifaCompleta } from '../datosRuta'
import { useFavoritoRuta } from '../hooks/useFavoritoRuta'
import HorariosRuta from './HorariosRuta'
import TarifasRuta from './TarifasRuta'
import SalidasRuta from './SalidasRuta'
import RecorridosDestino from '../../recorridos/components/RecorridosDestino'
import '../../../styles/destino.css'

/** Una sola composición para cualquier ruta publicada; sin variantes por pueblo. RF03 / CU-03. */
export default function DetalleRutaPublicada({ ruta }: { ruta: RutaDetalle }) {
  const paradas = ordenarParadas(ruta)
  const destino = paradas.at(-1)
  const origen = paradas.find(p => p.permiteAbordar)
  const foto = [...ruta.fotografias].sort((a, b) => a.orden - b.orden)[0]
  const { favorito, alternarFavorito, aviso } = useFavoritoRuta(String(ruta.idRuta))
  return <article className="destino-detalle" aria-labelledby="destino-titulo">
    <header className="destino-barra"><Link className="destino-boton-icono" to="/rutas" aria-label="Volver al catálogo de rutas"><span className="biin-icon" aria-hidden="true">arrow_back</span></Link>
      <span className="destino-estado-salida">{ruta.codigo}</span>
      <button type="button" className="destino-boton-icono destino-favorito" aria-label="Guardar ruta en este navegador" aria-pressed={favorito} onClick={alternarFavorito}><span className="biin-icon" aria-hidden="true">{favorito ? 'favorite' : 'favorite_border'}</span></button>
    </header>
    <div className="destino-presentacion"><h1 id="destino-titulo">{ruta.titulo}</h1><p>{ruta.descripcion ?? 'Sin descripción publicada.'}</p></div>
    <div className="destino-metricas">
      <section className="destino-tarjeta destino-metrica destino-metrica-precio"><h2>Tarifa del recorrido completo</h2><p className="destino-valor"><strong>{moneda(tarifaCompleta(ruta))}</strong></p><p>{ruta.notaTarifa}</p></section>
      <section className="destino-tarjeta destino-metrica"><h2>Paradas publicadas</h2><p className="destino-valor"><strong>{paradas.length}</strong></p><p>{paradas[0]?.localidad} → {destino?.localidad}</p></section>
    </div>
    <p className="destino-nota-datos">Información publicada · Actualizada: <time dateTime={ruta.actualizadoEn}>{fechaHora(ruta.actualizadoEn)}</time></p>
    <section className="destino-tarjeta destino-terminal"><span className="destino-icono-terminal biin-icon" aria-hidden="true">directions_bus</span><div><p className="destino-sobretitulo">Punto de abordaje</p><h2>{origen?.localidad ?? 'Sin confirmar'}</h2><p>{origen?.direccionReferencia ?? 'Sin dirección de abordaje publicada.'}</p></div></section>
    <section className="destino-tarjeta destino-recorrido"><header className="destino-recorrido-cabecera"><h2>Mapeo de ruta y paradas</h2></header>
      <MapaRecorrido paradas={paradas.map(p => ({ ...p, nombre: p.localidad }))} trazo={[...ruta.puntosRecorrido].sort((a, b) => a.orden - b.orden)} />
      {!ruta.puntosRecorrido.length && <p className="destino-nota-recorrido">No hay trazo publicado. El mapa muestra las ubicaciones registradas.</p>}
      {paradas.length ? <ol className="destino-paradas">{paradas.map((p, indice) => <li key={p.orden} className={`destino-parada destino-parada-${indice === 0 ? 'origen' : indice === paradas.length - 1 ? 'destino' : 'intermedia'}`}><span className="destino-marcador" aria-hidden="true" /><div><strong>{p.localidad}</strong><p>{p.direccionReferencia ?? 'Sin referencia publicada.'}</p><small>{[p.permiteAbordar && 'Permite abordar', p.permiteDescender && 'Permite descender'].filter(Boolean).join(' · ') || 'Parada de referencia'}</small></div></li>)}</ol> : <p>Sin paradas publicadas.</p>}
    </section>
    <HorariosRuta horarios={ruta.horarios} /><TarifasRuta ruta={ruta} /><SalidasRuta salidas={ruta.proximasSalidas} />
    <section className="destino-tarjeta destino-cultura"><FotografiaPublicada src={foto?.urlArchivo} alt={foto?.textoAlternativo || ruta.titulo} /><div className="destino-planificador"><h2>Descubre {destino?.localidad ?? ruta.titulo} a tu ritmo</h2><RecorridosDestino idLocalidad={destino?.idLocalidad} idRuta={ruta.idRuta} /></div></section>
    <p className="destino-nota-favorito" role="status">{aviso}</p>
  </article>
}
