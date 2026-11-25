import { describe, expect, it } from 'vitest'
import { duracionPlan } from '../../src/features/mi-viaje/plan/duracion'

describe('formato de duraciones', () => {
  it.each([
    [0, '0 min'], [45, '45 min'], [60, '1 h'], [65, '1 h 5 min'],
    [75, '1 h 15 min'], [240, '4 h'], [270, '4 h 30 min'],
  ])('muestra %i como %s', (minutos, texto) => {
    expect(duracionPlan(minutos)).toBe(texto)
  })
})
