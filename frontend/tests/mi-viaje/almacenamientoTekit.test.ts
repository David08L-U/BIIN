import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { guardarItinerarioLocal, leerItinerariosLocales } from '../../src/features/mi-viaje/storage/itinerariosLocales'
import { crearBorradorTekit } from '../../src/features/mi-viaje/plan/borradorTekit'
import { crearBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { calcularPlanValladolid } from '../../src/features/mi-viaje/plan/itinerarioValladolid'
import type { BorradorIzamal } from '../../src/features/mi-viaje/plan/itinerarioIzamal'

const clave = 'biin:itinerarios:v1:7'
const tekit = () => {
  const b = crearBorradorTekit('medio-dia', 'personalizado')
  return { ...b, configuracion: { ...b.configuracion, fecha: '2026-11-30' }, seleccion: ['corredor-textil'], generado: true }
}
const izamal: BorradorIzamal = { configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '11:30', minutosDisponibles: '240' }, modo: 'personalizado', seleccion: ['convento'], generado: true }
const antiguo = { id: 'izamal:antiguo', guardadoEn: '2026-11-20T12:00:00Z', borrador: izamal }
beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Tekit en almacenamiento v1 compatible', () => {
  it('añade Tekit junto a Izamal antiguo y Valladolid de una y dos jornadas sin cambiar sus datos', () => {
    localStorage.setItem(clave, JSON.stringify({ version: 1, itinerarios: [antiguo] }))
    for (const estancia of ['medio-dia', 'fin-de-semana'] as const) {
      const b = crearBorradorValladolid(estancia)
      b.configuracion.fecha = '2026-11-30'
      b.generado = true
      guardarItinerarioLocal(7, b)
    }
    const antes = leerItinerariosLocales(7).itinerarios
    const r = guardarItinerarioLocal(7, tekit())
    expect(r.guardado?.destino).toBe('tekit')
    expect(leerItinerariosLocales(7)).toEqual({ itinerarios: [...antes, r.guardado], error: null })
    expect(JSON.parse(localStorage.getItem(clave)!).itinerarios[0]).toEqual(antiguo)
    for (const item of antes) if (item.destino === 'valladolid') expect(calcularPlanValladolid(item.borrador).plan!.jornadas).toHaveLength(item.borrador.configuracion.estancia === 'fin-de-semana' ? 2 : 1)
    expect(guardarItinerarioLocal(7, izamal).guardado).toEqual(antiguo)
    expect(localStorage.length).toBe(1)
  })

  it('no duplica y separa identidad por destino, modalidad, modo, configuración y selección', () => {
    const b = tekit()
    const primero = guardarItinerarioLocal(7, b).guardado!
    expect(guardarItinerarioLocal(7, structuredClone(b)).guardado!.id).toBe(primero.id)
    guardarItinerarioLocal(7, { ...b, modo: 'recomendado' })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, estancia: 'ruta-textil' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, fecha: '2026-12-01' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, horaInicio: '11:00' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, minutosDisponibles: '360' } })
    guardarItinerarioLocal(7, { ...b, seleccion: ['taller-bordado'] })
    guardarItinerarioLocal(7, izamal)
    expect(leerItinerariosLocales(7).itinerarios).toHaveLength(8)
    expect(new Set(leerItinerariosLocales(7).itinerarios.map(i => i.id)).size).toBe(8)
    expect(leerItinerariosLocales(8).itinerarios).toEqual([])
    guardarItinerarioLocal(8, b)
    expect(leerItinerariosLocales(8).itinerarios).toHaveLength(1)
    expect(leerItinerariosLocales(7).itinerarios).toHaveLength(8)
  })

  it.each(['{roto', '{"version":9,"itinerarios":[]}', '{"version":1,"itinerarios":[{}]}'])('bloquea escritura sobre datos dañados sin borrarlos: %s', original => {
    localStorage.setItem(clave, original)
    expect(leerItinerariosLocales(7).error).not.toBeNull()
    expect(guardarItinerarioLocal(7, tekit()).guardado).toBeNull()
    expect(localStorage.getItem(clave)).toBe(original)
  })

  it('valida datos desconocidos y conserva registros legibles de un conjunto parcialmente dañado', () => {
    const malo = { destino: 'tekit', id: 'tekit:roto', guardadoEn: antiguo.guardadoEn, borrador: { ...tekit(), seleccion: ['convento'] } }
    const original = JSON.stringify({ version: 1, itinerarios: [antiguo, malo] })
    localStorage.setItem(clave, original)
    expect(leerItinerariosLocales(7).itinerarios).toEqual([antiguo])
    expect(guardarItinerarioLocal(7, tekit()).guardado).toBeNull()
    expect(localStorage.getItem(clave)).toBe(original)
  })

  it('rechaza borradores sin generar, excedidos, con tipos dañados o con destino cruzado', () => {
    expect(guardarItinerarioLocal(7, { ...tekit(), generado: false }).guardado).toBeNull()
    expect(guardarItinerarioLocal(7, { ...tekit(), configuracion: { ...tekit().configuracion, minutosDisponibles: '30' } }).guardado).toBeNull()
    const corruptos = [
      { ...tekit(), seleccion: [null] },
      { ...tekit(), configuracion: null },
      { ...tekit(), configuracion: { ...tekit().configuracion, minutosDisponibles: 240 } },
      { ...tekit(), destino: 'izamal' },
    ]
    for (const borrador of corruptos) {
      localStorage.setItem(clave, JSON.stringify({ version: 1, itinerarios: [{ destino: 'tekit', id: 'roto', guardadoEn: antiguo.guardadoEn, borrador }] }))
      expect(leerItinerariosLocales(7).error).not.toBeNull()
      expect(leerItinerariosLocales(7).itinerarios).toEqual([])
    }
  })

  it('conserva los planes anteriores ante falta de espacio sin anunciar éxito', () => {
    localStorage.setItem(clave, JSON.stringify({ version: 1, itinerarios: [antiguo] }))
    const original = localStorage.getItem(clave)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    expect(guardarItinerarioLocal(7, tekit())).toMatchObject({ guardado: null, error: expect.stringContaining('No se pudo guardar') })
    expect(localStorage.getItem(clave)).toBe(original)
  })

  it('tolera almacenamiento bloqueado y cuentas inválidas', () => {
    expect(guardarItinerarioLocal(0, tekit()).guardado).toBeNull()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    expect(leerItinerariosLocales(7).error).not.toBeNull()
    expect(guardarItinerarioLocal(7, tekit()).guardado).toBeNull()
  })
})
