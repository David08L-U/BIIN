import { describe, expect, it } from 'vitest'
import { crearBorradorHomun } from '../../src/features/mi-viaje/plan/borradorHomun'
import { crearBorradorTekit } from '../../src/features/mi-viaje/plan/borradorTekit'
import { crearBorradorTicul } from '../../src/features/mi-viaje/plan/borradorTicul'
import { crearBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { leerBorradorIzamal } from '../../src/features/mi-viaje/plan/borradorIzamal'
import { calcularPlan as calcularIzamal } from '../../src/features/mi-viaje/plan/itinerarioIzamal'
import { calcularPlanValladolid } from '../../src/features/mi-viaje/plan/itinerarioValladolid'
import { validarConfiguracionJornadas, ventanasJornadas } from '../../src/features/mi-viaje/plan/recorridoJornadas'
import { calcularPlanTekit } from '../../src/features/mi-viaje/plan/itinerarioTekit'
import { calcularPlanHomun } from '../../src/features/mi-viaje/plan/itinerarioHomun'
import { calcularPlanTicul } from '../../src/features/mi-viaje/plan/itinerarioTicul'
import { fechaHoyOFutura, fechaPasadaLocal, hoyLocal } from '../../src/features/mi-viaje/plan/tiempoLocal'

const hoy = '2026-03-11'
const ayer = '2026-03-10'
const manana = '2026-03-12'

describe('fechas locales de visita', () => {
  it('calcula hoy por componentes locales al cruzar la medianoche', () => {
    expect(hoyLocal(new Date(2026, 2, 11, 0, 5))).toBe(hoy)
  })

  it.each([
    [ayer, false],
    [hoy, true],
    [manana, true],
  ])('acepta como mínimo hoy (%s)', (fecha, valida) => {
    expect(fechaHoyOFutura(fecha, hoy)).toBe(valida)
    expect(fechaPasadaLocal(fecha, hoy)).toBe(!valida && fecha === ayer)
  })

  it.each(['recomendado', 'personalizado'] as const)(
    'rechaza una fecha pasada en los cinco planificadores, modo %s', modo => {
      const izamal = leerBorradorIzamal(new URLSearchParams(`fecha=${ayer}&modo=${modo}&lugares=convento&generado=1`))
      expect(calcularIzamal(izamal, hoy).plan).toBeNull()

      const valladolid = crearBorradorValladolid('medio-dia', modo)
      valladolid.configuracion.fecha = ayer
      expect(calcularPlanValladolid(valladolid, hoy).plan).toBeNull()

      const tekit = crearBorradorTekit('medio-dia', modo)
      tekit.configuracion.fecha = ayer
      expect(calcularPlanTekit(tekit, hoy).plan).toBeNull()

      const homun = crearBorradorHomun('medio-dia', modo)
      homun.configuracion.fecha = ayer
      expect(calcularPlanHomun(homun, hoy).plan).toBeNull()

      const ticul = crearBorradorTicul('medio-dia', modo)
      ticul.configuracion.fecha = ayer
      expect(calcularPlanTicul(ticul, hoy).plan).toBeNull()
    },
  )

  it('conserva la fecha antigua del borrador hasta que la persona la corrija', () => {
    const borrador = leerBorradorIzamal(new URLSearchParams(`fecha=${ayer}&modo=personalizado`))
    expect(borrador.configuracion.fecha).toBe(ayer)
    expect(calcularIzamal(borrador, hoy).errores.join(' ')).toMatch(/fecha.*pasó/i)
  })

  it('mantiene fechas de jornadas consecutivas y valida cada jornada', () => {
    const configuracion = {
      estancia: 'fin-de-semana',
      fecha: hoy,
      horaInicio: '09:00',
      minutosDisponibles: '270',
      horaInicioDia2: '09:00',
      minutosDia2: '270',
    }
    expect(ventanasJornadas(configuracion).map(jornada => jornada.fecha)).toEqual([hoy, manana])
    expect(validarConfiguracionJornadas(configuracion, hoy).filter(error => /fecha.*pasó/i.test(error))).toEqual([])
    expect(validarConfiguracionJornadas({ ...configuracion, fecha: ayer }, hoy).some(error => /Día 1: la fecha ya pasó/i.test(error))).toBe(true)
  })
})
