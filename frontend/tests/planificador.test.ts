import { describe, expect, it } from 'vitest'
import { actividadesDemo } from '../src/features/exploracion/demo/actividades'
import {
  programar,
  tiempoTotal,
  validarPlan,
} from '../src/features/mi-viaje/planificador'
import { esPlan } from '../src/features/mi-viaje/usePlanes'
const seleccion = actividadesDemo.filter((a) =>
  ['izamal-convento', 'izamal-kinich'].includes(a.id),
)

describe('CU-09 Planeación de itinerarios', () => {
  it('suma las actividades y sus traslados', () => {
    expect(tiempoTotal(seleccion)).toBe(127)
  })
  it('asigna horas consecutivas incluyendo los traslados', () => {
    const agenda = programar(seleccion, '11:28')
    expect(agenda.map((a) => [a.desde, a.hasta])).toEqual([
      ['11:30', '12:30'],
      ['12:35', '13:35'],
    ])
  })
  it('respeta el orden elegido por el viajero', () => {
    const agenda = programar([...seleccion].reverse(), '11:28')
    expect(agenda[0].actividad.id).toBe('izamal-kinich')
    expect(agenda[0].desde).toBe('11:33')
  })
  it('rechaza una selección vacía', () => {
    expect(validarPlan([], '11:28', 270, '2026-12-01')).toContain(
      'al menos una',
    )
  })
  it('reserva 30 minutos para el regreso', () => {
    const totalExacto = [{ ...seleccion[0], minutos: 148, traslado: 2 }]
    expect(validarPlan(totalExacto, '11:28', 180, '2026-12-01')).toBeNull()
    expect(
      validarPlan(
        [{ ...totalExacto[0], minutos: 149 }],
        '11:28',
        180,
        '2026-12-01',
      ),
    ).toContain('30 minutos')
  })
  it('advierte sobre el exceso de estancia', () => {
    expect(
      validarPlan(
        actividadesDemo.filter((a) => a.destinoId === 'izamal'),
        '11:28',
        270,
        '2026-12-01',
      ),
    ).toContain('superan tu estancia')
  })
  it.each(['', '25:00', '12:70', '9:00'])(
    'rechaza la hora inválida %s',
    (hora) => {
      expect(validarPlan(seleccion, hora, 270, '2026-12-01')).toContain(
        'hora válida',
      )
    },
  )
  it('no permite cruzar medianoche', () => {
    expect(validarPlan(seleccion, '23:00', 270, '2026-12-01')).toContain(
      'medianoche',
    )
  })
  it('rechaza borradores corruptos', () => {
    expect(esPlan({ id: 'x', actividades: ['x'] })).toBe(false)
    expect(esPlan(null)).toBe(false)
    expect(
      esPlan({
        id: 'p',
        destinoId: 'izamal',
        fecha: '2026-12-01',
        inicio: '11:28',
        limite: 270,
        actividades: [1],
        actualizadoEn: '2026-11-18',
      }),
    ).toBe(false)
  })
})
