import type { ModoItinerario } from './itinerarioIzamal'
import { esModalidadTekit, modalidadesTekit } from './itinerarioTekit'
import type { BorradorTekit, ModalidadTekit } from './itinerarioTekit'

export function crearBorradorTekit(estancia: ModalidadTekit = 'medio-dia', modo: ModoItinerario = 'recomendado'): BorradorTekit {
  const valores = modalidadesTekit[estancia]
  return { destino: 'tekit', configuracion: { estancia, fecha: '', horaInicio: valores.hora, minutosDisponibles: valores.minutos }, modo, seleccion: [], generado: false }
}

/** Una URL parcial no recibe valores que pudieran generar un plan silenciosamente. */
export function leerBorradorTekit(p: URLSearchParams, modoInicial: ModoItinerario = 'recomendado'): BorradorTekit {
  const base = crearBorradorTekit('medio-dia', modoInicial)
  const parcial = ['estancia', 'fecha', 'inicio', 'minutos', 'lugares', 'generado'].some(campo => p.has(campo))
  const campo = (nombre: string, defecto: string) => p.getAll(nombre).length > 1 ? '' : p.get(nombre) ?? (parcial ? '' : defecto)
  const invalido = p.getAll('modo').length > 1 || p.getAll('generado').length > 1 || (p.has('generado') && !['0', '1'].includes(p.get('generado')!)) || (p.has('destino') && (p.get('destino') !== 'tekit' || p.getAll('destino').length > 1))
  return {
    destino: 'tekit',
    configuracion: { estancia: campo('estancia', base.configuracion.estancia), fecha: campo('fecha', ''), horaInicio: campo('inicio', base.configuracion.horaInicio), minutosDisponibles: campo('minutos', base.configuracion.minutosDisponibles) },
    modo: invalido ? '' : p.get('modo') ?? modoInicial,
    seleccion: p.getAll('lugares').length > 1 ? ['Selección repetida en el enlace'] : (p.get('lugares') ? p.get('lugares')!.split(',') : []),
    generado: p.get('generado') === '1',
  }
}

export function parametrosBorradorTekit(b: BorradorTekit): URLSearchParams {
  const c = b.configuracion
  const p = new URLSearchParams({ estancia: c.estancia, fecha: c.fecha, inicio: c.horaInicio, minutos: c.minutosDisponibles, modo: b.modo })
  if (b.seleccion.length) p.set('lugares', b.seleccion.join(','))
  if (b.generado) p.set('generado', '1')
  return p
}
export function urlBorradorTekit(pantalla: 'detalle' | 'itinerario' | 'personalizar', b: BorradorTekit): string {
  return `/rutas/tekit${pantalla === 'detalle' ? '' : `/${pantalla}`}?${parametrosBorradorTekit(b)}`
}
export function cambiarModalidadTekit(b: BorradorTekit, estancia: string): BorradorTekit {
  return { ...b, generado: false, configuracion: { ...b.configuracion, estancia, minutosDisponibles: esModalidadTekit(estancia) ? modalidadesTekit[estancia].minutos : '' } }
}
