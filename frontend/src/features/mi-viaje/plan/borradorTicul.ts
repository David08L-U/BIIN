import type { ModoItinerario } from './itinerarioIzamal'
import { esModalidadTicul, modalidadesTicul } from './itinerarioTicul'
import type { BorradorTicul, ModalidadTicul } from './itinerarioTicul'

export function crearBorradorTicul(estancia: ModalidadTicul = 'medio-dia', modo: ModoItinerario = 'recomendado'): BorradorTicul {
  const v = modalidadesTicul[estancia]
  return { destino: 'ticul', configuracion: { estancia, fecha: '', horaInicio: v.hora, minutosDisponibles: v.minutos, ...(estancia === 'fin-de-semana' ? { horaInicioDia2: '09:00', minutosDia2: '540' } : {}) }, modo, seleccion: [], generado: false }
}
export function leerBorradorTicul(p: URLSearchParams, modoInicial: ModoItinerario = 'recomendado'): BorradorTicul {
  const base = crearBorradorTicul('medio-dia', modoInicial)
  const parcial = ['estancia', 'fecha', 'inicio', 'minutos', 'inicio2', 'minutos2', 'lugares', 'dia1', 'dia2', 'generado'].some(c => p.has(c))
  const campo = (nombre: string, defecto: string) => p.getAll(nombre).length > 1 ? '' : p.get(nombre) ?? (parcial ? '' : defecto)
  const invalido = p.getAll('modo').length > 1 || p.getAll('generado').length > 1 || (p.has('generado') && !['0', '1'].includes(p.get('generado')!)) || (p.has('destino') && (p.get('destino') !== 'ticul' || p.getAll('destino').length > 1))
  return {
    destino: 'ticul', configuracion: { estancia: campo('estancia', base.configuracion.estancia), fecha: campo('fecha', ''), horaInicio: campo('inicio', base.configuracion.horaInicio), minutosDisponibles: campo('minutos', base.configuracion.minutosDisponibles), horaInicioDia2: campo('inicio2', '09:00'), minutosDia2: campo('minutos2', (campo('estancia', base.configuracion.estancia) === 'fin-de-semana' ? '540' : '')), preferencia: p.get('preferencia') ?? (p.get('estancia') === 'tour-compras' ? 'tour-compras' : p.get('estancia') === 'dia-completo' ? 'ruta-puuc' : '') },
    modo: invalido ? '' : p.get('modo') ?? modoInicial,
    seleccion: p.getAll('lugares').length > 1 ? ['Selección repetida en el enlace'] : [...new Set([...(p.get('lugares')?.split(',') ?? []), ...(p.get('dia2')?.split(',') ?? [])].filter(Boolean))],
    seleccionDia2: p.getAll('dia2').length > 1 ? ['Selección repetida en el enlace'] : [...new Set((p.get('dia2') ?? '').split(',').filter(Boolean))],
    generado: p.get('generado') === '1',
    editarId: p.get('editar') ?? undefined,
  }
}
export function parametrosBorradorTicul(b: BorradorTicul): URLSearchParams {
  const c = b.configuracion
  const p = new URLSearchParams({ estancia: c.estancia, fecha: c.fecha, inicio: c.horaInicio, minutos: c.minutosDisponibles, modo: b.modo })
  if (c.horaInicioDia2) p.set('inicio2', c.horaInicioDia2)
  if (c.minutosDia2) p.set('minutos2', c.minutosDia2)
  if (c.preferencia) p.set('preferencia', c.preferencia)
  if (b.seleccionDia2?.length) p.set('dia2', b.seleccionDia2.join(','))
  if (b.seleccion.length) p.set('lugares', b.seleccion.join(','))
  if (b.generado) p.set('generado', '1')
  if (b.editarId) p.set('editar', b.editarId)
  return p
}
export function urlBorradorTicul(pantalla: 'detalle' | 'itinerario' | 'personalizar', b: BorradorTicul): string {
  return `/rutas/ticul${pantalla === 'detalle' ? '' : `/${pantalla}`}?${parametrosBorradorTicul(b)}`
}
export function cambiarModalidadTicul(b: BorradorTicul, estancia: string): BorradorTicul {
  if (estancia === 'medio-dia' || estancia === 'dia-completo' || estancia === 'fin-de-semana') return { ...b, generado: false, configuracion: { ...b.configuracion, estancia, preferencia: b.configuracion.preferencia || (b.configuracion.estancia === 'tour-compras' || b.configuracion.estancia === 'ruta-puuc' ? b.configuracion.estancia : undefined), minutosDisponibles: modalidadesTicul[estancia].minutos, ...(estancia === 'fin-de-semana' ? { horaInicioDia2: '09:00', minutosDia2: '540' } : { horaInicioDia2: undefined, minutosDia2: undefined }) } }
  return esModalidadTicul(estancia) ? { ...b, generado: false, configuracion: { ...b.configuracion, estancia, preferencia: estancia, minutosDisponibles: modalidadesTicul[estancia].minutos } } : b
}
