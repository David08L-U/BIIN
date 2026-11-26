import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { guardarItinerarioLocal, leerItinerariosLocales } from '../../src/features/mi-viaje/storage/itinerariosLocales'
import { crearBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import type { BorradorIzamal } from '../../src/features/mi-viaje/plan/itinerarioIzamal'
import type { BorradorValladolid } from '../../src/features/mi-viaje/plan/itinerarioValladolid'

const izamal: BorradorIzamal = { configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '11:30', minutosDisponibles: '240' }, modo: 'personalizado', seleccion: ['convento'], generado: true }
const antiguo = { id: 'izamal:identidad-antigua', guardadoEn: '2026-11-20T12:00:00.000Z', borrador: izamal }
function valladolid(): BorradorValladolid {
  const b = crearBorradorValladolid('fin-de-semana', 'personalizado')
  return { ...b, configuracion: { ...b.configuracion, fecha: '2026-11-30' }, seleccion: [{ lugarId: 'zaci', dia: 1 }, { lugarId: 'san-bernardino', dia: 2 }], generado: true }
}
const clave = 'biin:itinerarios:v1:7'
beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Compatibilidad de itinerarios por destino y cuenta', () => {
  it('lee un registro antiguo de Izamal sin destino y no lo duplica ni reescribe al guardarlo otra vez', () => {
    const original = JSON.stringify({ version: 1, itinerarios: [antiguo] })
    localStorage.setItem(clave, original)
    expect(leerItinerariosLocales(7)).toEqual({ itinerarios: [antiguo], error: null })
    expect(guardarItinerarioLocal(7, izamal).guardado).toEqual(antiguo)
    expect(localStorage.getItem(clave)).toBe(original)
  })

  it('añade Valladolid sin perder el registro antiguo y marca el destino de los planes nuevos', () => {
    localStorage.setItem(clave, JSON.stringify({ version: 1, itinerarios: [antiguo] }))
    const nuevo = guardarItinerarioLocal(7, valladolid())
    expect(nuevo.error).toBeNull()
    expect(nuevo.guardado?.destino).toBe('valladolid')
    const nuevoIzamal = guardarItinerarioLocal(7, { ...izamal, seleccion: ['kinich'] })
    expect(nuevoIzamal.guardado?.destino).toBe('izamal')
    expect(leerItinerariosLocales(7).itinerarios).toEqual([antiguo, nuevo.guardado, nuevoIzamal.guardado])
    expect(JSON.parse(localStorage.getItem(clave)!).itinerarios[0]).toEqual(antiguo)
  })

  it('evita duplicados e incluye destino, configuración, jornadas y selección en la identidad', () => {
    const b = valladolid()
    const primero = guardarItinerarioLocal(7, b).guardado!
    expect(guardarItinerarioLocal(7, structuredClone(b)).guardado!.id).toBe(primero.id)
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, horaInicioDia2: '10:00' } })
    guardarItinerarioLocal(7, { ...b, configuracion: { ...b.configuracion, minutosDia2: '300' } })
    guardarItinerarioLocal(7, { ...b, seleccion: [{ lugarId: 'san-bernardino', dia: 1 }, { lugarId: 'zaci', dia: 2 }] })
    guardarItinerarioLocal(7, izamal)
    expect(leerItinerariosLocales(7).itinerarios).toHaveLength(5)
    expect(new Set(leerItinerariosLocales(7).itinerarios.map(i => i.id)).size).toBe(5)
    expect(leerItinerariosLocales(8).itinerarios).toEqual([])
    guardarItinerarioLocal(8, b)
    expect(leerItinerariosLocales(8).itinerarios).toHaveLength(1)
    expect(leerItinerariosLocales(7).itinerarios).toHaveLength(5)
  })

  it.each(['{roto', '{"version":9,"itinerarios":[]}', '{"version":1,"itinerarios":[{}]}'])('conserva el contenido incompatible o dañado sin sobrescribir: %s', original => {
    localStorage.setItem(clave, original)
    expect(leerItinerariosLocales(7).error).not.toBeNull()
    expect(guardarItinerarioLocal(7, valladolid()).guardado).toBeNull()
    expect(guardarItinerarioLocal(7, izamal).guardado).toBeNull()
    expect(localStorage.getItem(clave)).toBe(original)
  })

  it('recupera los registros válidos de un conjunto parcialmente dañado y bloquea escrituras sobre el original', () => {
    const original = JSON.stringify({ version: 1, itinerarios: [antiguo, { ...antiguo, id: 'desconocido', destino: 'otro' }] })
    localStorage.setItem(clave, original)
    expect(leerItinerariosLocales(7).itinerarios).toEqual([antiguo])
    expect(leerItinerariosLocales(7).error).not.toBeNull()
    expect(guardarItinerarioLocal(7, valladolid()).guardado).toBeNull()
    expect(localStorage.getItem(clave)).toBe(original)
  })

  it('rechaza una jornada dañada, sin reinterpretarla como un plan de Izamal', () => {
    const b = valladolid()
    b.configuracion.minutosDia2 = '2880'
    expect(guardarItinerarioLocal(7, b).guardado).toBeNull()
    const original = JSON.stringify({ version: 1, itinerarios: [antiguo, { id: 'valladolid:roto', destino: 'valladolid', guardadoEn: antiguo.guardadoEn, borrador: b }] })
    localStorage.setItem(clave, original)
    expect(leerItinerariosLocales(7).itinerarios).toEqual([antiguo])
    expect(guardarItinerarioLocal(7, valladolid()).guardado).toBeNull()
    expect(localStorage.getItem(clave)).toBe(original)
  })

  it('un fallo de escritura conserva todos los registros anteriores y nunca devuelve éxito', () => {
    const original = JSON.stringify({ version: 1, itinerarios: [antiguo] })
    localStorage.setItem(clave, original)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    expect(guardarItinerarioLocal(7, valladolid())).toMatchObject({ guardado: null, error: expect.stringContaining('No se pudo guardar') })
    expect(localStorage.getItem(clave)).toBe(original)
    expect(leerItinerariosLocales(7).itinerarios).toEqual([antiguo])
  })

  it('maneja almacenamiento bloqueado e identificadores de cuenta inválidos', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    expect(leerItinerariosLocales(7).error).not.toBeNull()
    expect(guardarItinerarioLocal(7, valladolid()).guardado).toBeNull()
    expect(guardarItinerarioLocal(0, valladolid()).guardado).toBeNull()
  })
})
