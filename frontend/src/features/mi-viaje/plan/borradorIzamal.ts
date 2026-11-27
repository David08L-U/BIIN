import { estanciasIzamal } from './itinerarioIzamal'
import type { BorradorIzamal, ConfiguracionViaje, EstanciaIzamal } from './itinerarioIzamal'

export function cambiarEstanciaIzamal(configuracion: ConfiguracionViaje, estancia: string): ConfiguracionViaje {
  if (!Object.hasOwn(estanciasIzamal, estancia)) return configuracion
  const valores = estanciasIzamal[estancia as keyof typeof estanciasIzamal]
  return { ...configuracion, estancia: estancia as ConfiguracionViaje['estancia'], minutosDisponibles: valores.minutos, ...(estancia === 'fin-de-semana' ? { horaInicioDia2: '09:00', minutosDia2: '540' } : { horaInicioDia2: undefined, minutosDia2: undefined }) }
}

export function leerBorradorIzamal(parametros: URLSearchParams): BorradorIzamal {
  const valor = parametros.get('estancia')
  const estancia: EstanciaIzamal = valor === 'dia-completo' || valor === 'tarde-magica' || valor === 'fin-de-semana' ? valor : 'medio-dia'
  return {
    configuracion: {
      estancia,
      fecha: parametros.get('fecha') ?? '',
      horaInicio: parametros.get('inicio') ?? estanciasIzamal[estancia].hora,
      minutosDisponibles: parametros.get('minutos') ?? estanciasIzamal[estancia].minutos,
      horaInicioDia2: parametros.get('inicio2') ?? (estancia === 'fin-de-semana' ? '09:00' : undefined),
      minutosDia2: parametros.get('minutos2') ?? (estancia === 'fin-de-semana' ? '540' : undefined),
    },
    modo: parametros.get('modo') === 'personalizado' ? 'personalizado' : 'recomendado',
    seleccion: [...new Set([...(parametros.get('lugares') ?? '').split(',').filter(Boolean), ...(parametros.get('dia2') ?? '').split(',').filter(Boolean)])],
    seleccionDia2: [...new Set((parametros.get('dia2') ?? '').split(',').filter(Boolean))],
    generado: parametros.get('generado') === '1',
    editarId: parametros.get('editar') ?? undefined,
  }
}

export function parametrosBorrador(borrador: BorradorIzamal): URLSearchParams {
  const { configuracion: config } = borrador
  const parametros = new URLSearchParams({ estancia: config.estancia, fecha: config.fecha, inicio: config.horaInicio, minutos: config.minutosDisponibles, modo: borrador.modo })
  if (config.horaInicioDia2) parametros.set('inicio2', config.horaInicioDia2)
  if (config.minutosDia2) parametros.set('minutos2', config.minutosDia2)
  if (borrador.seleccion.length) parametros.set('lugares', borrador.seleccion.join(','))
  if (borrador.seleccionDia2?.length) parametros.set('dia2', borrador.seleccionDia2.join(','))
  if (borrador.generado) parametros.set('generado', '1')
  if (borrador.editarId) parametros.set('editar', borrador.editarId)
  return parametros
}

export function urlBorrador(destino: 'detalle' | 'itinerario' | 'personalizar', borrador: BorradorIzamal): string {
  return `/rutas/izamal${destino === 'detalle' ? '' : `/${destino}`}?${parametrosBorrador(borrador)}`
}
