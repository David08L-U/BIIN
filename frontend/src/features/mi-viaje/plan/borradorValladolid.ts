import type { EstanciaValladolid } from '../../transporte/data/detalleValladolidPrototipo'
import type { ModoItinerario } from './itinerarioIzamal'
import { esEstanciaValladolid, estanciasValladolid } from './itinerarioValladolid'
import type { BorradorValladolid } from './itinerarioValladolid'

export function crearBorradorValladolid(estancia: EstanciaValladolid = 'medio-dia', modo: ModoItinerario = 'recomendado'): BorradorValladolid {
  const valores = estanciasValladolid[estancia]
  return { destino: 'valladolid', configuracion: { estancia, fecha: '', horaInicio: valores.hora, minutosDisponibles: valores.minutos, horaInicioDia2: '09:00', minutosDia2: '540' }, modo, seleccion: [], generado: false }
}

export function leerBorradorValladolid(parametros: URLSearchParams, modoInicial: ModoItinerario = 'recomendado'): BorradorValladolid {
  const estancia = parametros.get('estancia') ?? 'medio-dia'
  const base = crearBorradorValladolid(esEstanciaValladolid(estancia) ? estancia : 'medio-dia', modoInicial)
  const tieneConfig = ['estancia', 'fecha', 'inicio', 'minutos', 'inicio2', 'minutos2', 'generado', 'dia1', 'dia2'].some(campo => parametros.has(campo))
  const campo = (nombre: string, defecto: string) => parametros.getAll(nombre).length > 1 ? '' : parametros.get(nombre) ?? (tieneConfig ? '' : defecto)
  const seleccionDia = (dia: number) => {
    const valores = parametros.getAll(`dia${dia}`)
    if (valores.length > 1) return [{ lugarId: 'Parámetro de selección repetido', dia }]
    return (valores[0] ? valores[0].split(',') : []).map(lugarId => ({ lugarId, dia }))
  }
  return {
    destino: 'valladolid',
    configuracion: {
      estancia: campo('estancia', base.configuracion.estancia), fecha: campo('fecha', ''),
      horaInicio: campo('inicio', base.configuracion.horaInicio), minutosDisponibles: campo('minutos', base.configuracion.minutosDisponibles),
      horaInicioDia2: campo('inicio2', base.configuracion.horaInicioDia2), minutosDia2: campo('minutos2', base.configuracion.minutosDia2),
    },
    modo: parametros.getAll('modo').length > 1 || (parametros.has('generado') && !['0', '1'].includes(parametros.get('generado')!)) || parametros.getAll('generado').length > 1 ? '' : parametros.get('modo') ?? modoInicial,
    seleccion: [...seleccionDia(1), ...seleccionDia(2)],
    generado: parametros.get('generado') === '1',
    editarId: parametros.get('editar') ?? undefined,
  }
}

export function parametrosBorradorValladolid(borrador: BorradorValladolid): URLSearchParams {
  const c = borrador.configuracion
  const parametros = new URLSearchParams({ estancia: c.estancia, fecha: c.fecha, inicio: c.horaInicio, minutos: c.minutosDisponibles, inicio2: c.horaInicioDia2, minutos2: c.minutosDia2, modo: borrador.modo })
  for (const dia of [1, 2]) {
    const ids = borrador.seleccion.filter(s => s.dia === dia).map(s => s.lugarId)
    if (ids.length) parametros.set(`dia${dia}`, ids.join(','))
  }
  if (borrador.generado) parametros.set('generado', '1')
  if (borrador.editarId) parametros.set('editar', borrador.editarId)
  return parametros
}

export function urlBorradorValladolid(pantalla: 'detalle' | 'itinerario' | 'personalizar', borrador: BorradorValladolid): string {
  return `/rutas/valladolid${pantalla === 'detalle' ? '' : `/${pantalla}`}?${parametrosBorradorValladolid(borrador)}`
}

export function cambiarEstanciaValladolid(borrador: BorradorValladolid, estancia: EstanciaValladolid): BorradorValladolid {
  const valores = estanciasValladolid[estancia]
  return {
    ...borrador, generado: false,
    configuracion: { ...borrador.configuracion, estancia, horaInicio: valores.hora, minutosDisponibles: valores.minutos, horaInicioDia2: '09:00', minutosDia2: '540' },
    seleccion: estancia === 'fin-de-semana' ? borrador.seleccion : borrador.seleccion.map(s => ({ ...s, dia: 1 })),
  }
}
