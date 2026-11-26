import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { guardarItinerarioLocal, leerItinerariosLocales } from '../../src/features/mi-viaje/storage/itinerariosLocales'
import { crearBorradorHomun } from '../../src/features/mi-viaje/plan/borradorHomun'
import { crearBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { crearBorradorTekit } from '../../src/features/mi-viaje/plan/borradorTekit'
import { calcularPlanValladolid } from '../../src/features/mi-viaje/plan/itinerarioValladolid'
import type { BorradorIzamal } from '../../src/features/mi-viaje/plan/itinerarioIzamal'

const clave = 'biin:itinerarios:v1:7'
const homun = () => {
  const b = crearBorradorHomun('fin-de-semana', 'personalizado')
  return { ...b, configuracion: { ...b.configuracion, fecha: '2026-11-30' }, seleccion: [{ lugarId: 'santa-rosa', dia: 1 }, { lugarId: 'tza-ujun-kat', dia: 2 }], generado: true }
}
const izamal: BorradorIzamal = { configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '11:30', minutosDisponibles: '240' }, modo: 'personalizado', seleccion: ['convento'], generado: true }
const antiguo = { id: 'izamal:antiguo', guardadoEn: '2026-11-20T12:00:00Z', borrador: izamal }
beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Homún en almacenamiento compatible v1', () => {
  it('conserva Izamal antiguo, Valladolid de una y dos jornadas y Tekit textil al añadir Homún', () => {
    localStorage.setItem(clave, JSON.stringify({ version: 1, itinerarios: [antiguo] }))
    for (const estancia of ['medio-dia', 'fin-de-semana'] as const) {
      const b = crearBorradorValladolid(estancia); b.configuracion.fecha = '2026-11-30'; b.generado = true
      guardarItinerarioLocal(7, b)
    }
    const tk = crearBorradorTekit('ruta-textil'); tk.configuracion.fecha = '2026-11-30'; tk.configuracion.minutosDisponibles = '180'; tk.generado = true
    guardarItinerarioLocal(7, tk)
    const antes = leerItinerariosLocales(7).itinerarios
    const nuevo = guardarItinerarioLocal(7, homun()).guardado
    expect(nuevo?.destino).toBe('homun')
    expect(leerItinerariosLocales(7)).toEqual({ itinerarios: [...antes, nuevo], error: null })
    expect(JSON.parse(localStorage.getItem(clave)!).itinerarios[0]).toEqual(antiguo)
    expect(guardarItinerarioLocal(7, izamal).guardado).toEqual(antiguo)
    for (const item of antes) {
      if (item.destino === 'valladolid') expect(calcularPlanValladolid(item.borrador).plan!.jornadas).toHaveLength(item.borrador.configuracion.estancia === 'fin-de-semana' ? 2 : 1)
      if (item.destino === 'tekit') expect(item.borrador.configuracion.estancia).toBe('ruta-textil')
    }
    expect(localStorage.length).toBe(1)
  })
  it('evita duplicados y separa destino, modo, estancia, cada ventana y selección por jornada', () => {
    const b = homun()
    const primero = guardarItinerarioLocal(7, b).guardado!
    expect(guardarItinerarioLocal(7, structuredClone(b)).guardado!.id).toBe(primero.id)
    guardarItinerarioLocal(7, { ...b, modo: 'recomendado' })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, fecha: '2026-12-01' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, horaInicio: '10:00' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, horaInicioDia2: '11:00' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, minutosDisponibles: '300' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, minutosDia2: '300' } })
    guardarItinerarioLocal(7, { ...b, seleccion: [{ lugarId: 'santa-rosa', dia: 2 }, { lugarId: 'tza-ujun-kat', dia: 1 }] })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, estancia: 'dia-completo' }, seleccion: b.seleccion.map(s => ({ ...s, dia: 1 })) })
    guardarItinerarioLocal(7, izamal)
    expect(leerItinerariosLocales(7).itinerarios).toHaveLength(10)
    expect(new Set(leerItinerariosLocales(7).itinerarios.map(i => i.id)).size).toBe(10)
    expect(leerItinerariosLocales(8).itinerarios).toEqual([])
    guardarItinerarioLocal(8, b)
    expect(leerItinerariosLocales(8).itinerarios).toHaveLength(1)
    expect(leerItinerariosLocales(7).itinerarios).toHaveLength(10)
  })
  it.each(['{roto', '{"version":9,"itinerarios":[]}', '{"version":1,"itinerarios":[{}]}'])('no sobrescribe datos dañados: %s', original => {
    localStorage.setItem(clave, original)
    expect(leerItinerariosLocales(7).error).not.toBeNull()
    expect(guardarItinerarioLocal(7, homun()).guardado).toBeNull()
    expect(localStorage.getItem(clave)).toBe(original)
  })
  it('recupera registros válidos y bloquea nuevas escrituras ante un Homún incompatible', () => {
    const corruptos = [
      { ...homun(), seleccion: [{ lugarId: 'zaci', dia: 1 }] },
      { ...homun(), seleccion: [null] },
      { ...homun(), destino: 'valladolid' },
      { ...homun(), configuracion: null },
      { ...homun(), configuracion: { ...homun().configuracion, minutosDia2: 270 } },
      { ...homun(), configuracion: { ...homun().configuracion, minutosDia2: '2880' } },
    ]
    for (const borrador of corruptos) {
      const original = JSON.stringify({ version: 1, itinerarios: [antiguo, { destino: 'homun', id: 'homun:roto', guardadoEn: antiguo.guardadoEn, borrador }] })
      localStorage.setItem(clave, original)
      expect(leerItinerariosLocales(7).itinerarios).toEqual([antiguo])
      expect(guardarItinerarioLocal(7, homun()).guardado).toBeNull()
      expect(localStorage.getItem(clave)).toBe(original)
    }
  })
  it('rechaza borradores sin resultado o con una jornada excedida', () => {
    expect(guardarItinerarioLocal(7, { ...homun(), generado: false }).guardado).toBeNull()
    expect(guardarItinerarioLocal(7, { ...homun(), configuracion: { ...homun().configuracion, minutosDia2: '30' } }).guardado).toBeNull()
  })
  it('no pierde los registros previos ni anuncia éxito ante falta de espacio', () => {
    localStorage.setItem(clave, JSON.stringify({ version: 1, itinerarios: [antiguo] }))
    const original = localStorage.getItem(clave)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    expect(guardarItinerarioLocal(7, homun())).toMatchObject({ guardado: null, error: expect.stringContaining('No se pudo guardar') })
    expect(localStorage.getItem(clave)).toBe(original)
  })
  it('maneja almacenamiento bloqueado y cuentas inválidas', () => {
    expect(guardarItinerarioLocal(0, homun()).guardado).toBeNull()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    expect(leerItinerariosLocales(7).error).not.toBeNull()
    expect(guardarItinerarioLocal(7, homun()).guardado).toBeNull()
  })
})
