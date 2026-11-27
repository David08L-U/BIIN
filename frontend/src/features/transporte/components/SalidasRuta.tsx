import { useEffect, useState } from 'react'
import type { SalidaConCupo } from '../types'
import { cupoVigente } from '../datosRuta'
import { fechaHora } from '../../../utils/formatoDatos'

/** Reevalúa vencimientos con la página abierta. RF04 / RNF07. */
export default function SalidasRuta({ salidas }: { salidas: SalidaConCupo[] }) {
  const [ahora, setAhora] = useState(Date.now)
  useEffect(() => { const timer = window.setInterval(() => setAhora(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  return <section className="destino-tarjeta datos-publicados"><h2>Próximas salidas</h2>
    {salidas.length ? <ul>{salidas.map(s => <li key={s.idSalida}><strong>{fechaHora(s.salidaProgramada)}</strong><span>{s.unidad} · {s.estadoSalida.replaceAll('_', ' ')}</span>
      <span>{cupoVigente(s, ahora) ? `${s.asientosDisponibles} asientos disponibles` : 'Disponibilidad sin confirmar'}</span>
      {s.registradoEn && <small>Reportado: {fechaHora(s.registradoEn)} · vigencia: {fechaHora(s.validoHasta)}</small>}
    </li>)}</ul> : <p>No hay próximas salidas publicadas.</p>}
  </section>
}
