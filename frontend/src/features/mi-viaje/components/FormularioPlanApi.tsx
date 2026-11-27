import type { ConfiguracionPlanApi } from '../plan/planApi'

export default function FormularioPlanApi({ config, cambiar, personalizado = false, disabled = false }: {
  config: ConfiguracionPlanApi; cambiar: (config: ConfiguracionPlanApi) => void; personalizado?: boolean; disabled?: boolean
}) {
  const campo = (nombre: keyof ConfiguracionPlanApi, valor: string) => cambiar({ ...config, [nombre]: valor })
  return <fieldset className="iz-plan-tarjeta formulario-api" disabled={disabled}><legend>Configura tu visita</legend>
    <label>Nombre del itinerario<input required minLength={2} maxLength={120} value={config.nombre} onChange={e => campo('nombre', e.target.value)} /></label>
    <div className="formulario-api-fila"><label>Fecha de inicio<input type="date" required value={config.inicio} onChange={e => campo('inicio', e.target.value)} /></label><label>Fecha final<input type="date" required min={config.inicio} value={config.fin} onChange={e => campo('fin', e.target.value)} /></label></div>
    {!personalizado && <label>Hora de inicio en Yucatán<input type="time" required value={config.horaInicio} onChange={e => campo('horaInicio', e.target.value)} /></label>}
    <label>Presupuesto estimado en MXN (opcional)<input inputMode="decimal" type="number" min="0" max="9999999" step="0.01" value={config.presupuesto} onChange={e => campo('presupuesto', e.target.value)} /></label>
    {personalizado && <p>Después de guardar podrás asignar horarios y notas a cada actividad. Los eventos conservan sus horarios publicados.</p>}
  </fieldset>
}
