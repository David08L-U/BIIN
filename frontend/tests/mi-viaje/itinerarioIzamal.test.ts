import { describe, expect, it } from 'vitest'
import { lugaresIzamal } from '../../src/features/mi-viaje/data/lugaresIzamal'
import { calcularPlan, inicioLocal, instantePlan, recomendarLugares, resumirSeleccion, validarConfiguracion } from '../../src/features/mi-viaje/plan/itinerarioIzamal'
import type { BorradorIzamal } from '../../src/features/mi-viaje/plan/itinerarioIzamal'
import { leerBorradorIzamal, parametrosBorrador } from '../../src/features/mi-viaje/plan/borradorIzamal'

const base: BorradorIzamal = { configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '11:30', minutosDisponibles: '240' }, modo: 'personalizado', seleccion: ['convento', 'kinich'], generado: true }

describe('Cálculo de itinerarios de demostración CU-09 / RF09', () => {
  it('suma visitas, traslados iniciales e intermedios, regreso y margen final', () => {
    const { plan } = calcularPlan(base)
    expect(plan).toMatchObject({ visitasMinutos: 120, trasladosMinutos: 12, margenMinutos: 15, totalMinutos: 147, libresMinutos: 93 })
    expect(plan!.bloques.reduce((suma, bloque) => suma + bloque.fin - bloque.inicio, 0)).toBe(147)
    expect(plan!.bloques.at(-1)).toMatchObject({ tipo: 'margen', inicio: 132, fin: 147 })
  })

  it('produce intervalos enteros, ordenados, contiguos y sin solapamiento', () => {
    const plan = calcularPlan(base).plan!
    for (const [indice, bloque] of plan.bloques.entries()) {
      expect(Number.isInteger(bloque.inicio) && Number.isInteger(bloque.fin)).toBe(true)
      expect(bloque.fin).toBeGreaterThan(bloque.inicio)
      expect(bloque.inicio).toBe(indice ? plan.bloques[indice - 1].fin : 0)
    }
    expect(plan.bloques.at(-1)!.fin).toBeLessThanOrEqual(Number(base.configuracion.minutosDisponibles))
  })

  it('rechaza exceso sin quitar ni truncar lugares', () => {
    const borrador = { ...base, configuracion: { ...base.configuracion, minutosDisponibles: '120' } }
    expect(calcularPlan(borrador)).toEqual({ plan: null, errores: [expect.stringContaining('excede el tiempo disponible por 27 min')] })
    expect(borrador.seleccion).toEqual(['convento', 'kinich'])
  })

  it('exige selección y rechaza identificadores desconocidos o repetidos', () => {
    for (const seleccion of [[], ['desconocido'], ['kinich', 'kinich']]) expect(calcularPlan({ ...base, seleccion }).plan).toBeNull()
  })

  it.each(['', '0', '-1', 'NaN', '12.5', '721', '1e2'])('rechaza duración inválida %s', minutosDisponibles => {
    expect(validarConfiguracion({ ...base.configuracion, minutosDisponibles })).toContain('El tiempo disponible debe ser un número entero entre 15 min y 12 h.')
  })

  it.each(['', '2026-02-30', '2026-13-01', '30/11/2026'])('rechaza fecha inválida %s', fecha => {
    expect(calcularPlan({ ...base, configuracion: { ...base.configuracion, fecha } }).plan).toBeNull()
  })

  it.each(['', '24:00', '12:60', '9:3'])('rechaza hora inválida %s', horaInicio => {
    expect(calcularPlan({ ...base, configuracion: { ...base.configuracion, horaInicio } }).plan).toBeNull()
  })

  it('interpreta fecha y hora locales y añade minutos incluso al cruzar medianoche', () => {
    const configuracion = { ...base.configuracion, horaInicio: '23:30' }
    const inicio = inicioLocal(configuracion)!
    expect([inicio.getFullYear(), inicio.getMonth(), inicio.getDate(), inicio.getHours(), inicio.getMinutes()]).toEqual([2026, 10, 30, 23, 30])
    const fin = instantePlan(configuracion, 90)
    expect(fin.getTime() - inicio.getTime()).toBe(90 * 60_000)
    expect(fin.getDate()).toBe(1)
    expect(fin.getMonth()).toBe(11)
  })

  it.each([52, 60, 90, 180, 240, 480, 720])('recomienda una combinación completa que cabe en %i minutos', minutos => {
    const seleccion = recomendarLugares(minutos)
    expect(seleccion.length).toBeGreaterThan(0)
    expect(resumirSeleccion(seleccion).totalMinutos).toBeLessThanOrEqual(minutos)
    expect(seleccion.every(id => lugaresIzamal.some(lugar => lugar.id === id))).toBe(true)
  })

  it('ofrece una alternativa si no cabe ninguna visita completa', () => {
    const resultado = calcularPlan({ ...base, modo: 'recomendado', configuracion: { ...base.configuracion, minutosDisponibles: '30' } })
    expect(resultado.plan).toBeNull()
    expect(resultado.errores.join(' ')).toContain('por lo menos 52 minutos')
  })

  it('recupera la configuración de la URL y sus duraciones iniciales sin generar un plan', () => {
    expect(leerBorradorIzamal(new URLSearchParams('estancia=dia-completo')).configuracion.minutosDisponibles).toBe('540')
    expect(leerBorradorIzamal(new URLSearchParams('estancia=tarde-magica')).configuracion.minutosDisponibles).toBe('180')
    expect(leerBorradorIzamal(new URLSearchParams()).generado).toBe(false)
    expect(leerBorradorIzamal(parametrosBorrador(base))).toMatchObject(base)
  })
})
