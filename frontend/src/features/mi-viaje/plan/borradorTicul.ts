import type { ModoItinerario } from './itinerarioIzamal'
import { esModalidadTicul, modalidadesTicul } from './itinerarioTicul'
import type { BorradorTicul, ModalidadTicul } from './itinerarioTicul'

export function crearBorradorTicul(estancia: ModalidadTicul = 'medio-dia', modo: ModoItinerario = 'recomendado'): BorradorTicul {
  const v = modalidadesTicul[estancia]
  return { destino: 'ticul', configuracion: { estancia, fecha: '', horaInicio: v.hora, minutosDisponibles: v.minutos }, modo, seleccion: [], generado: false }
}
export function leerBorradorTicul(p: URLSearchParams, modoInicial: ModoItinerario = 'recomendado'): BorradorTicul {
  const base = crearBorradorTicul('medio-dia', modoInicial)
  const parcial = ['estancia', 'fecha', 'inicio', 'minutos', 'lugares', 'generado'].some(c => p.has(c))
  const campo = (nombre: string, defecto: string) => p.getAll(nombre).length > 1 ? '' : p.get(nombre) ?? (parcial ? '' : defecto)
  const invalido = p.getAll('modo').length > 1 || p.getAll('generado').length > 1 || (p.has('generado') && !['0', '1'].includes(p.get('generado')!)) || (p.has('destino') && (p.get('destino') !== 'ticul' || p.getAll('destino').length > 1))
  return {
    destino: 'ticul', configuracion: { estancia: campo('estancia', base.configuracion.estancia), fecha: campo('fecha', ''), horaInicio: campo('inicio', base.configuracion.horaInicio), minutosDisponibles: campo('minutos', base.configuracion.minutosDisponibles) },
    modo: invalido ? '' : p.get('modo') ?? modoInicial,
    seleccion: p.getAll('lugares').length > 1 ? ['Selección repetida en el enlace'] : (p.get('lugares') ? p.get('lugares')!.split(',') : []),
    generado: p.get('generado') === '1',
    editarId: p.get('editar') ?? undefined,
  }
}
export function parametrosBorradorTicul(b: BorradorTicul): URLSearchParams {
  const c = b.configuracion
  const p = new URLSearchParams({ estancia: c.estancia, fecha: c.fecha, inicio: c.horaInicio, minutos: c.minutosDisponibles, modo: b.modo })
  if (b.seleccion.length) p.set('lugares', b.seleccion.join(','))
  if (b.generado) p.set('generado', '1')
  if (b.editarId) p.set('editar', b.editarId)
  return p
}
export function urlBorradorTicul(pantalla: 'detalle' | 'itinerario' | 'personalizar', b: BorradorTicul): string {
  return `/rutas/ticul${pantalla === 'detalle' ? '' : `/${pantalla}`}?${parametrosBorradorTicul(b)}`
}
export function cambiarModalidadTicul(b: BorradorTicul, estancia: string): BorradorTicul {
  return { ...b, generado: false, configuracion: { ...b.configuracion, estancia, minutosDisponibles: esModalidadTicul(estancia) ? modalidadesTicul[estancia].minutos : '' } }
}
