import type { EstanciaHomun } from '../../transporte/data/detalleHomunPrototipo'
import type { ModoItinerario } from './itinerarioIzamal'
import { esEstanciaHomun, estanciasHomun } from './itinerarioHomun'
import type { BorradorHomun } from './itinerarioHomun'

export function crearBorradorHomun(estancia: EstanciaHomun = 'medio-dia', modo: ModoItinerario = 'recomendado'): BorradorHomun {
  const v = estanciasHomun[estancia]
  return { destino: 'homun', configuracion: { estancia, fecha: '', horaInicio: v.hora, minutosDisponibles: v.minutos, horaInicioDia2: '09:00', minutosDia2: '270' }, modo, seleccion: [], generado: false }
}

/** La URL conserva cada jornada. No completa silenciosamente una configuración parcial. */
export function leerBorradorHomun(p: URLSearchParams, modoInicial: ModoItinerario = 'recomendado'): BorradorHomun {
  const base = crearBorradorHomun('medio-dia', modoInicial)
  const parcial = ['estancia', 'fecha', 'inicio', 'minutos', 'inicio2', 'minutos2', 'dia1', 'dia2', 'generado'].some(c => p.has(c))
  const campo = (nombre: string, defecto: string) => p.getAll(nombre).length > 1 ? '' : p.get(nombre) ?? (parcial ? '' : defecto)
  const seleccionDia = (dia: number) => p.getAll(`dia${dia}`).length > 1 ? [{ lugarId: 'Selección repetida en el enlace', dia }] : (p.get(`dia${dia}`) ? p.get(`dia${dia}`)!.split(',').map(lugarId => ({ lugarId, dia })) : [])
  let jornadaInvalida = false
  p.forEach((_valor, c) => { if (/^dia\d+$/.test(c) && c !== 'dia1' && c !== 'dia2') jornadaInvalida = true })
  const invalido = jornadaInvalida || p.getAll('modo').length > 1 || p.getAll('generado').length > 1 || (p.has('generado') && !['0', '1'].includes(p.get('generado')!)) || (p.has('destino') && (p.get('destino') !== 'homun' || p.getAll('destino').length > 1))
  return {
    destino: 'homun',
    configuracion: { estancia: campo('estancia', base.configuracion.estancia), fecha: campo('fecha', ''), horaInicio: campo('inicio', base.configuracion.horaInicio), minutosDisponibles: campo('minutos', base.configuracion.minutosDisponibles), horaInicioDia2: campo('inicio2', base.configuracion.horaInicioDia2), minutosDia2: campo('minutos2', base.configuracion.minutosDia2) },
    modo: invalido ? '' : p.get('modo') ?? modoInicial,
    seleccion: [...seleccionDia(1), ...seleccionDia(2)], generado: p.get('generado') === '1',
  }
}
export function parametrosBorradorHomun(b: BorradorHomun): URLSearchParams {
  const c = b.configuracion
  const p = new URLSearchParams({ estancia: c.estancia, fecha: c.fecha, inicio: c.horaInicio, minutos: c.minutosDisponibles, inicio2: c.horaInicioDia2, minutos2: c.minutosDia2, modo: b.modo })
  for (const dia of [1, 2]) {
    const ids = b.seleccion.filter(s => s.dia === dia).map(s => s.lugarId)
    if (ids.length) p.set(`dia${dia}`, ids.join(','))
  }
  // Mantiene asignaciones ajenas para que sigan siendo inválidas al cambiar de pantalla.
  if (b.seleccion.some(s => s.dia !== 1 && s.dia !== 2)) p.set('dia3', 'Asignación inválida')
  if (b.generado) p.set('generado', '1')
  return p
}
export function urlBorradorHomun(pantalla: 'detalle' | 'itinerario' | 'personalizar', b: BorradorHomun): string {
  return `/rutas/homun${pantalla === 'detalle' ? '' : `/${pantalla}`}?${parametrosBorradorHomun(b)}`
}
export function cambiarEstanciaHomun(b: BorradorHomun, estancia: EstanciaHomun): BorradorHomun {
  if (!esEstanciaHomun(estancia)) return b
  const v = estanciasHomun[estancia]
  return { ...b, generado: false, configuracion: { ...b.configuracion, estancia, horaInicio: b.configuracion.horaInicio || v.hora, minutosDisponibles: v.minutos, horaInicioDia2: b.configuracion.horaInicioDia2 || '09:00', minutosDia2: b.configuracion.minutosDia2 || '270' }, seleccion: estancia === 'fin-de-semana' ? b.seleccion : b.seleccion.map(s => ({ ...s, dia: 1 })) }
}
