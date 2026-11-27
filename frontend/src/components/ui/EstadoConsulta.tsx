import type { ConsultaApi } from '../../hooks/useConsultaApi'

/** Estados explícitos, sin sustituir errores por datos del prototipo. RNF06-07. */
export default function EstadoConsulta<T>({ consulta, vacio = 'No hay información publicada.' }: {
  consulta: ConsultaApi<T>; vacio?: string
}) {
  if (consulta.cargando) return <p className="estado-consulta" role="status">Cargando información…</p>
  if (consulta.error) return <div className="estado-consulta"><p role="alert">{consulta.error}</p><button type="button" onClick={consulta.reintentar}>Reintentar</button></div>
  if (consulta.datos === null) return <p className="estado-consulta" role="status">{vacio}</p>
  return null
}
