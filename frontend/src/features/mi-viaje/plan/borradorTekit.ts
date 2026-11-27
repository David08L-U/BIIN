import type { ModoItinerario } from './itinerarioIzamal'
import { esModalidadTekit, modalidadesTekit } from './itinerarioTekit'
import type { BorradorTekit, ModalidadTekit } from './itinerarioTekit'

export function crearBorradorTekit(estancia: ModalidadTekit = 'medio-dia', modo: ModoItinerario = 'recomendado'): BorradorTekit {
  const valores = modalidadesTekit[estancia]
  return { destino: 'tekit', configuracion: { estancia, fecha: '', horaInicio: valores.hora, minutosDisponibles: valores.minutos, ...(estancia === 'fin-de-semana' ? { horaInicioDia2: '09:00', minutosDia2: '540' } : {}) }, modo, seleccion: [], generado: false }
}

/** Una URL parcial no recibe valores que pudieran generar un plan silenciosamente. */
export function leerBorradorTekit(p: URLSearchParams, modoInicial: ModoItinerario = 'recomendado'): BorradorTekit {
  const base = crearBorradorTekit('medio-dia', modoInicial)
  const parcial = ['estancia', 'fecha', 'inicio', 'minutos', 'inicio2', 'minutos2', 'lugares', 'dia1', 'dia2', 'generado'].some(campo => p.has(campo))
  const campo = (nombre: string, defecto: string) => p.getAll(nombre).length > 1 ? '' : p.get(nombre) ?? (parcial ? '' : defecto)
  const invalido = p.getAll('modo').length > 1 || p.getAll('generado').length > 1 || (p.has('generado') && !['0', '1'].includes(p.get('generado')!)) || (p.has('destino') && (p.get('destino') !== 'tekit' || p.getAll('destino').length > 1))
  return {
    destino: 'tekit',
    configuracion: { estancia: campo('estancia', base.configuracion.estancia), fecha: campo('fecha', ''), horaInicio: campo('inicio', base.configuracion.horaInicio), minutosDisponibles: campo('minutos', base.configuracion.minutosDisponibles), horaInicioDia2: campo('inicio2', '09:00'), minutosDia2: campo('minutos2', (campo('estancia', base.configuracion.estancia) === 'fin-de-semana' ? '540' : '')) , preferencia: p.get('preferencia') ?? (p.get('estancia') === 'ruta-textil' ? 'ruta-textil' : '') },
    modo: invalido ? '' : p.get('modo') ?? modoInicial,
    seleccion: p.getAll('lugares').length > 1 ? ['Selección repetida en el enlace'] : [...new Set([...(p.get('lugares')?.split(',') ?? []), ...(p.get('dia2')?.split(',') ?? [])].filter(Boolean))],
    seleccionDia2: p.getAll('dia2').length > 1 ? ['Selección repetida en el enlace'] : [...new Set((p.get('dia2') ?? '').split(',').filter(Boolean))],
    generado: p.get('generado') === '1',
    editarId: p.get('editar') ?? undefined,
  }
}

export function parametrosBorradorTekit(b: BorradorTekit): URLSearchParams {
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
export function urlBorradorTekit(pantalla: 'detalle' | 'itinerario' | 'personalizar', b: BorradorTekit): string {
  return `/rutas/tekit${pantalla === 'detalle' ? '' : `/${pantalla}`}?${parametrosBorradorTekit(b)}`
}
export function cambiarModalidadTekit(b: BorradorTekit, estancia: string): BorradorTekit {
  if (estancia === 'medio-dia' || estancia === 'dia-completo' || estancia === 'fin-de-semana') return { ...b, generado: false, configuracion: { ...b.configuracion, estancia, preferencia: b.configuracion.preferencia || (b.configuracion.estancia === 'ruta-textil' ? 'ruta-textil' : undefined), minutosDisponibles: modalidadesTekit[estancia].minutos, ...(estancia === 'fin-de-semana' ? { horaInicioDia2: '09:00', minutosDia2: '540' } : { horaInicioDia2: undefined, minutosDia2: undefined }) } }
  return esModalidadTekit(estancia) ? { ...b, generado: false, configuracion: { ...b.configuracion, estancia, preferencia: estancia, minutosDisponibles: modalidadesTekit[estancia].minutos } } : b
}
