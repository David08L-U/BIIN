import { Link } from 'react-router'
import type { RutaDetalle } from '../types'
import { moneda } from '../../../utils/formatoDatos'

export default function TarifasRuta({ ruta }: { ruta: RutaDetalle }) {
  return <>
    <section className="destino-tarjeta datos-publicados"><h2>Tarifas aproximadas</h2><p>{ruta.notaTarifa}</p>
      {ruta.tarifas.length ? <ul>{ruta.tarifas.map(t => <li key={t.idTarifa}>{t.localidadOrigen} → {t.localidadDestino}: <strong>{moneda(t.monto)}</strong><small>Vigente desde {t.vigenteDesde}{t.vigenteHasta ? ` hasta ${t.vigenteHasta}` : ''}</small></li>)}</ul> : <p>Sin tarifas vigentes publicadas.</p>}
    </section>
    <section className="destino-tarjeta datos-publicados"><h2>Opciones de regreso</h2>
      {ruta.rutasRegreso.length ? <ul>{ruta.rutasRegreso.map(r => <li key={r.idRuta}><Link to={`/rutas/${r.idRuta}`}>{r.titulo}</Link><span>{r.origen} → {r.destino} · {moneda(r.tarifaAproximada)}</span></li>)}</ul> : <p>No hay rutas de regreso publicadas. Confirma el regreso con el operador.</p>}
    </section>
  </>
}
