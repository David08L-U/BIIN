import { fechaValida, hoyYucatan } from '../../../utils/formatoDatos'
import type { CrearItinerarioRequest } from '../api'

export interface ConfiguracionPlanApi { nombre: string; inicio: string; fin: string; presupuesto: string; horaInicio: string }
export function configuracionInicial(parametros: URLSearchParams, titulo: string): ConfiguracionPlanApi {
  return { nombre: parametros.get('nombre') ?? titulo, inicio: parametros.get('inicio') ?? hoyYucatan(), fin: parametros.get('fin') ?? parametros.get('inicio') ?? hoyYucatan(), presupuesto: parametros.get('presupuesto') ?? '', horaInicio: parametros.get('hora') ?? '09:00' }
}
export function validarPlanApi(config: ConfiguracionPlanApi): string[] {
  const errores: string[] = []
  if (config.nombre.trim().length < 2 || config.nombre.trim().length > 120) errores.push('El nombre debe tener entre 2 y 120 caracteres.')
  if (!fechaValida(config.inicio) || !fechaValida(config.fin)) errores.push('Indica fechas válidas.')
  else if (config.fin < config.inicio) errores.push('La fecha final no puede ser anterior al inicio.')
  else if ((Date.parse(`${config.fin}T12:00:00Z`) - Date.parse(`${config.inicio}T12:00:00Z`)) / 86400000 >= 60) errores.push('El itinerario puede durar como máximo 60 días.')
  if (config.presupuesto !== '' && (!/^\d+(\.\d{1,2})?$/.test(config.presupuesto) || Number(config.presupuesto) > 9999999)) errores.push('El presupuesto debe ser un monto válido entre 0 y 9,999,999 MXN.')
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(config.horaInicio)) errores.push('Indica una hora válida.')
  return errores
}
export const datosCrearPlan = (c: ConfiguracionPlanApi): CrearItinerarioRequest => ({ nombre: c.nombre.trim(), inicio: c.inicio, fin: c.fin, presupuestoEstimado: c.presupuesto === '' ? null : Number(c.presupuesto) })

/** Guarda el borrador en la URL para conservarlo al alternar modo o iniciar sesión. */
export function parametrosPlanApi(config: ConfiguracionPlanApi, seleccion: number[], personalizado: boolean): URLSearchParams {
  const params = new URLSearchParams({ nombre: config.nombre, inicio: config.inicio, fin: config.fin, presupuesto: config.presupuesto, hora: config.horaInicio })
  if (personalizado) params.set('seleccion', seleccion.join(','))
  return params
}
