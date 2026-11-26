import { estanciasIzamal } from './itinerarioIzamal'
import type { BorradorIzamal, ConfiguracionViaje, EstanciaIzamal } from './itinerarioIzamal'

export function cambiarEstanciaIzamal(configuracion: ConfiguracionViaje, estancia: string): ConfiguracionViaje {
  if (estancia !== 'medio-dia' && estancia !== 'dia-completo' && estancia !== 'tarde-magica') return configuracion
  return { ...configuracion, estancia, minutosDisponibles: estanciasIzamal[estancia].minutos }
}

export function leerBorradorIzamal(parametros: URLSearchParams): BorradorIzamal {
  const valor = parametros.get('estancia')
  const estancia: EstanciaIzamal = valor === 'dia-completo' || valor === 'tarde-magica' ? valor : 'medio-dia'
  return {
    configuracion: {
      estancia,
      fecha: parametros.get('fecha') ?? '',
      horaInicio: parametros.get('inicio') ?? estanciasIzamal[estancia].hora,
      minutosDisponibles: parametros.get('minutos') ?? estanciasIzamal[estancia].minutos,
    },
    modo: parametros.get('modo') === 'personalizado' ? 'personalizado' : 'recomendado',
    seleccion: [...new Set((parametros.get('lugares') ?? '').split(',').filter(Boolean))],
    generado: parametros.get('generado') === '1',
  }
}

export function parametrosBorrador(borrador: BorradorIzamal): URLSearchParams {
  const { configuracion: config } = borrador
  const parametros = new URLSearchParams({ estancia: config.estancia, fecha: config.fecha, inicio: config.horaInicio, minutos: config.minutosDisponibles, modo: borrador.modo })
  if (borrador.seleccion.length) parametros.set('lugares', borrador.seleccion.join(','))
  if (borrador.generado) parametros.set('generado', '1')
  return parametros
}

export function urlBorrador(destino: 'detalle' | 'itinerario' | 'personalizar', borrador: BorradorIzamal): string {
  return `/rutas/izamal${destino === 'detalle' ? '' : `/${destino}`}?${parametrosBorrador(borrador)}`
}
