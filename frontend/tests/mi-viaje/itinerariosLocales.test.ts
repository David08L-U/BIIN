import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { eliminarItinerarioLocal, guardarItinerarioLocal, leerItinerariosLocales } from '../../src/features/mi-viaje/storage/itinerariosLocales'
import type { BorradorIzamal } from '../../src/features/mi-viaje/plan/itinerarioIzamal'

const borrador: BorradorIzamal = { configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '11:30', minutosDisponibles: '240' }, modo: 'personalizado', seleccion: ['convento', 'kinich'], generado: true }
beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Guardado local por cuenta CU-09', () => {
  it('guarda, recupera e impide duplicados por pulsaciones repetidas', () => {
    const primera = guardarItinerarioLocal(7, borrador)
    expect(primera.error).toBeNull()
    expect(primera.guardado).not.toBeNull()
    expect(guardarItinerarioLocal(7, borrador).guardado!.id).toBe(primera.guardado!.id)
    expect(leerItinerariosLocales(7).itinerarios).toEqual([primera.guardado])
  })

  it('separa cuentas por identificador estable', () => {
    guardarItinerarioLocal(7, borrador)
    expect(leerItinerariosLocales(8).itinerarios).toEqual([])
    guardarItinerarioLocal(8, { ...borrador, seleccion: ['mercado'] })
    expect(leerItinerariosLocales(7).itinerarios[0].borrador.seleccion).toEqual(['convento', 'kinich'])
    expect(leerItinerariosLocales(8).itinerarios[0].borrador.seleccion).toEqual(['mercado'])
  })

  it('rechaza borradores sin generar o que ya no caben', () => {
    expect(guardarItinerarioLocal(7, { ...borrador, generado: false }).guardado).toBeNull()
    expect(guardarItinerarioLocal(7, { ...borrador, configuracion: { ...borrador.configuracion, minutosDisponibles: '20' } }).guardado).toBeNull()
    expect(leerItinerariosLocales(7).itinerarios).toHaveLength(0)
  })

  it.each(['{roto', '{"version":1,"itinerarios":[{}]}', '{"version":9,"itinerarios":[]}'])('maneja datos dañados sin sobrescribirlos: %s', texto => {
    localStorage.setItem('biin:itinerarios:v1:7', texto)
    expect(leerItinerariosLocales(7).error).not.toBeNull()
    expect(guardarItinerarioLocal(7, borrador).guardado).toBeNull()
    expect(localStorage.getItem('biin:itinerarios:v1:7')).toBe(texto)
  })

  it('informa de escrituras fallidas y no afirma éxito', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    const resultado = guardarItinerarioLocal(7, borrador)
    expect(resultado.guardado).toBeNull()
    expect(resultado.error).toContain('No se pudo guardar')
    expect(leerItinerariosLocales(7).itinerarios).toEqual([])
  })

  it('maneja lecturas bloqueadas sin lanzar excepciones', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    expect(leerItinerariosLocales(7)).toMatchObject({ itinerarios: [], error: expect.any(String) })
    expect(guardarItinerarioLocal(7, borrador).guardado).toBeNull()
  })

  it('elimina únicamente un viaje de la cuenta solicitada y mantiene los de otras cuentas', () => {
    const primero = guardarItinerarioLocal(7, borrador).guardado!
    const segundo = guardarItinerarioLocal(7, { ...borrador, seleccion: ['mercado'] }).guardado!
    guardarItinerarioLocal(8, borrador)
    expect(eliminarItinerarioLocal(7, primero.id)).toEqual({ eliminado: true, error: null })
    expect(leerItinerariosLocales(7).itinerarios.map(item => item.id)).toEqual([segundo.id])
    expect(leerItinerariosLocales(8).itinerarios).toHaveLength(1)
  })

  it('no anuncia eliminación ante identificador ausente o error de escritura', () => {
    const item = guardarItinerarioLocal(7, borrador).guardado!
    expect(eliminarItinerarioLocal(7, 'otro-id').eliminado).toBe(false)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    expect(eliminarItinerarioLocal(7, item.id)).toMatchObject({ eliminado: false, error: expect.stringContaining('No se pudo eliminar') })
    vi.restoreAllMocks()
    expect(leerItinerariosLocales(7).itinerarios).toHaveLength(1)
  })
})
