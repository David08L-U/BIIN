import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { guardarItinerarioLocal, leerItinerariosLocales } from '../../src/features/mi-viaje/storage/itinerariosLocales'
import { crearBorradorTicul } from '../../src/features/mi-viaje/plan/borradorTicul'
import { crearBorradorHomun } from '../../src/features/mi-viaje/plan/borradorHomun'
import { crearBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { crearBorradorTekit } from '../../src/features/mi-viaje/plan/borradorTekit'
import { calcularPlanHomun } from '../../src/features/mi-viaje/plan/itinerarioHomun'
import { calcularPlanValladolid } from '../../src/features/mi-viaje/plan/itinerarioValladolid'
import type { BorradorIzamal } from '../../src/features/mi-viaje/plan/itinerarioIzamal'

const clave = 'biin:itinerarios:v1:7'
const ticul = () => {
  const b = crearBorradorTicul('tour-compras', 'personalizado')
  return { ...b, configuracion: { ...b.configuracion, fecha: '2026-11-30', minutosDisponibles: '300' }, seleccion: ['talleres-alfareros', 'corredor-calzado'], generado: true }
}
const izamal: BorradorIzamal = { configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '11:30', minutosDisponibles: '240' }, modo: 'personalizado', seleccion: ['convento'], generado: true }
const antiguo = { id: 'izamal:antiguo', guardadoEn: '2026-11-20T12:00:00Z', borrador: izamal }
beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Ticul en almacenamiento compatible v1', () => {
  it('conserva Izamal sin destino, las jornadas de Valladolid y Homún y Tekit textil', () => {
    localStorage.setItem(clave, JSON.stringify({ version: 1, itinerarios: [antiguo] }))
    for (const estancia of ['medio-dia', 'fin-de-semana'] as const) {
      const va = crearBorradorValladolid(estancia); va.configuracion.fecha = '2026-11-30'; va.generado = true
      expect(guardarItinerarioLocal(7, va).error).toBeNull()
      const hm = crearBorradorHomun(estancia); hm.configuracion.fecha = '2026-11-30'; hm.generado = true
      expect(guardarItinerarioLocal(7, hm).error).toBeNull()
    }
    const tk = crearBorradorTekit('ruta-textil'); tk.configuracion.fecha = '2026-11-30'; tk.configuracion.minutosDisponibles = '180'; tk.generado = true
    expect(guardarItinerarioLocal(7, tk).error).toBeNull()
    const antes = leerItinerariosLocales(7).itinerarios
    expect(antes).toHaveLength(6)
    const nuevo = guardarItinerarioLocal(7, ticul()).guardado
    expect(nuevo?.destino).toBe('ticul')
    expect(leerItinerariosLocales(7)).toEqual({ itinerarios: [...antes, nuevo], error: null })
    expect(JSON.parse(localStorage.getItem(clave)!).itinerarios[0]).toEqual(antiguo)
    expect(guardarItinerarioLocal(7, izamal).guardado).toEqual(antiguo)
    for (const item of antes) {
      if (item.destino === 'valladolid') expect(calcularPlanValladolid(item.borrador).plan!.jornadas).toHaveLength(item.borrador.configuracion.estancia === 'fin-de-semana' ? 2 : 1)
      if (item.destino === 'homun') expect(calcularPlanHomun(item.borrador).plan!.jornadas).toHaveLength(item.borrador.configuracion.estancia === 'fin-de-semana' ? 2 : 1)
      if (item.destino === 'tekit') expect(item.borrador.configuracion.estancia).toBe('ruta-textil')
    }
    expect(localStorage.length).toBe(1)
  })
  it('evita duplicados por identidad efectiva, separa modalidad/configuración/selección/cuenta', () => {
    const b = ticul()
    const primero = guardarItinerarioLocal(7, b).guardado!
    expect(guardarItinerarioLocal(7, structuredClone(b)).guardado!.id).toBe(primero.id)
    expect(guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, minutosDisponibles: '0300' } }).guardado!.id).toBe(primero.id)
    guardarItinerarioLocal(7, { ...b, modo: 'recomendado' })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, estancia: 'dia-completo' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, fecha: '2026-12-01' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, horaInicio: '10:00' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, minutosDisponibles: '360' } })
    guardarItinerarioLocal(7, { ...b, seleccion: [...b.seleccion].reverse() })
    guardarItinerarioLocal(7, { ...b, seleccion: ['corredor-calzado'] })
    guardarItinerarioLocal(7, izamal)
    expect(leerItinerariosLocales(7).itinerarios).toHaveLength(9)
    expect(new Set(leerItinerariosLocales(7).itinerarios.map(i => i.id)).size).toBe(9)
    expect(leerItinerariosLocales(8).itinerarios).toEqual([])
    guardarItinerarioLocal(8, b)
    expect(leerItinerariosLocales(8).itinerarios).toHaveLength(1)
    expect(leerItinerariosLocales(7).itinerarios).toHaveLength(9)
  })
  it.each(['{roto', '{"version":9,"itinerarios":[]}', '{"version":1,"itinerarios":[{}]}'])('no sobrescribe datos dañados: %s', original => {
    localStorage.setItem(clave, original)
    expect(leerItinerariosLocales(7).error).not.toBeNull()
    expect(guardarItinerarioLocal(7, ticul()).guardado).toBeNull()
    expect(localStorage.getItem(clave)).toBe(original)
  })
  it('recupera registros válidos sin sobrescribir un registro de Ticul manipulado', () => {
    for (const borrador of [
      { ...ticul(), seleccion: ['santa-rosa'] }, { ...ticul(), seleccion: [null] },
      { ...ticul(), destino: 'tekit' }, { ...ticul(), configuracion: null },
      { ...ticul(), configuracion: { ...ticul().configuracion, minutosDisponibles: 300 } },
      { ...ticul(), configuracion: { ...ticul().configuracion, estancia: 'ruta-puuc-inventada' } },
    ]) {
      const original = JSON.stringify({ version: 1, itinerarios: [antiguo, { destino: 'ticul', id: 'ticul:roto', guardadoEn: antiguo.guardadoEn, borrador }] })
      localStorage.setItem(clave, original)
      expect(leerItinerariosLocales(7).itinerarios).toEqual([antiguo])
      expect(guardarItinerarioLocal(7, ticul()).guardado).toBeNull()
      expect(localStorage.getItem(clave)).toBe(original)
    }
  })
  it('no guarda borradores incompletos, resultados excedidos ni selecciones inválidas', () => {
    for (const b of [
      { ...ticul(), generado: false }, { ...ticul(), seleccion: [] }, { ...ticul(), modo: 'otro' },
      { ...ticul(), seleccion: ['corredor-calzado', 'corredor-calzado'] },
      { ...ticul(), configuracion: { ...ticul().configuracion, minutosDisponibles: '30' } },
    ]) expect(guardarItinerarioLocal(7, b).guardado).toBeNull()
    expect(localStorage.length).toBe(0)
  })
  it('no pierde los datos previos ni anuncia éxito cuando falta espacio', () => {
    localStorage.setItem(clave, JSON.stringify({ version: 1, itinerarios: [antiguo] }))
    const original = localStorage.getItem(clave)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    expect(guardarItinerarioLocal(7, ticul())).toMatchObject({ guardado: null, error: expect.stringContaining('No se pudo guardar') })
    expect(localStorage.getItem(clave)).toBe(original)
  })
  it('maneja almacenamiento bloqueado y cuentas inválidas', () => {
    expect(guardarItinerarioLocal(0, ticul()).guardado).toBeNull()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    expect(leerItinerariosLocales(7).error).not.toBeNull()
    expect(guardarItinerarioLocal(7, ticul()).guardado).toBeNull()
  })
})
