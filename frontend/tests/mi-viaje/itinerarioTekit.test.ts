import { describe, expect, it } from 'vitest'
import { lugaresTekit } from '../../src/features/mi-viaje/data/lugaresTekit'
import { calcularPlanTekit, resumirSeleccionTekit, validarConfiguracionTekit } from '../../src/features/mi-viaje/plan/itinerarioTekit'
import { cambiarModalidadTekit, crearBorradorTekit, leerBorradorTekit, parametrosBorradorTekit } from '../../src/features/mi-viaje/plan/borradorTekit'
import { inicioLocal, instanteLocal } from '../../src/features/mi-viaje/plan/tiempoLocal'

const base = () => {
  const b = crearBorradorTekit('medio-dia', 'personalizado')
  return { ...b, configuracion: { ...b.configuracion, fecha: '2026-11-30' }, seleccion: lugaresTekit.map(l => l.id), generado: true }
}

describe('Cálculo de Tekit CU-09 / RF09', () => {
  it('usa los cuatro lugares del HTML y suma visitas, traslados, regreso y margen', () => {
    expect(lugaresTekit.map(l => [l.visitaMinutos, l.trasladoMinutos])).toEqual([[65, 2], [45, 3], [50, 4], [30, 2]])
    const plan = calcularPlanTekit(base()).plan!
    expect(plan).toMatchObject({ visitasMinutos: 190, trasladosMinutos: 14, margenMinutos: 15, totalMinutos: 219, libresMinutos: 51 })
    expect(plan.bloques.slice(-2)).toEqual([
      expect.objectContaining({ tipo: 'traslado', inicio: 201, fin: 204 }),
      expect.objectContaining({ tipo: 'margen', inicio: 204, fin: 219 }),
    ])
  })

  it('mantiene intervalos enteros, contiguos y sin solapamientos, sin repetir visitas', () => {
    const plan = calcularPlanTekit(base()).plan!
    for (const [i, b] of plan.bloques.entries()) {
      expect(Number.isInteger(b.inicio) && Number.isInteger(b.fin)).toBe(true)
      expect(b.fin).toBeGreaterThan(b.inicio)
      expect(b.inicio).toBe(i ? plan.bloques[i - 1].fin : 0)
    }
    expect(plan.bloques.reduce((s, b) => s + b.fin - b.inicio, 0)).toBe(plan.totalMinutos)
    expect(plan.bloques.at(-1)!.fin + plan.libresMinutos).toBe(270)
    expect(new Set(plan.seleccion).size).toBe(plan.seleccion.length)
  })

  it('explica el exceso sin cambiar ni recortar la selección', () => {
    const b = base()
    b.configuracion.minutosDisponibles = '210'
    expect(calcularPlanTekit(b)).toEqual({ plan: null, errores: [expect.stringContaining('excede el tiempo disponible por 9 min')] })
    expect(b.seleccion).toHaveLength(4)
    expect(resumirSeleccionTekit(b.seleccion).totalMinutos).toBe(219)
  })

  it('recomienda visitas completas que caben o avisa si ninguna cabe', () => {
    for (let minutos = 15; minutos <= 720; minutos++) {
      const b = { ...base(), modo: 'recomendado' }
      b.configuracion.minutosDisponibles = String(minutos)
      const r = calcularPlanTekit(b)
      if (minutos < 50) { expect(r.plan).toBeNull(); expect(r.errores.join()).toContain('No cabe') }
      else {
        expect(r.plan).not.toBeNull()
        expect(r.plan!.totalMinutos).toBeLessThanOrEqual(minutos)
        expect(r.plan!.libresMinutos).toBe(minutos - r.plan!.totalMinutos)
        expect(r.plan!.seleccion.length).toBeLessThanOrEqual(4)
      }
    }
  })

  it('deja el tiempo sobrante libre en día completo y no inventa más negocios', () => {
    const b = cambiarModalidadTekit(base(), 'dia-completo')
    expect(b.configuracion.minutosDisponibles).toBe('540')
    const plan = calcularPlanTekit({ ...b, modo: 'recomendado' }).plan!
    expect(plan.totalMinutos).toBe(219)
    expect(plan.libresMinutos).toBe(321)
    expect(plan.seleccion).toEqual(lugaresTekit.map(l => l.id))
  })

  it('Ruta Textil pide tiempo y recomienda únicamente textiles sin agregar comida ni patrimonio', () => {
    const b = cambiarModalidadTekit({ ...base(), modo: 'recomendado', seleccion: [] }, 'ruta-textil')
    expect(b.configuracion.minutosDisponibles).toBe('')
    expect(calcularPlanTekit(b).errores.join()).toContain('no tiene duración fija')
    b.configuracion.minutosDisponibles = '360'
    expect(calcularPlanTekit(b).plan).toMatchObject({ seleccion: ['corredor-textil', 'taller-bordado'], totalMinutos: 133, libresMinutos: 227 })
    // Otras categorías sí pueden elegirse explícitamente en personalizado.
    expect(calcularPlanTekit({ ...b, modo: 'personalizado', seleccion: ['comida-mercado'] }).plan!.seleccion).toEqual(['comida-mercado'])
  })

  it.each(['', '0', '-1', '12.5', '1e2', 'Infinity', '721', '9007199254740993'])('valida minutos enteros: %s', minutosDisponibles => {
    expect(validarConfiguracionTekit({ ...base().configuracion, minutosDisponibles }).join()).toContain('número entero')
  })
  it.each(['', '2026-02-30', '2026-13-01', '30/11/2026'])('rechaza fecha inválida %s', fecha => {
    expect(calcularPlanTekit({ ...base(), configuracion: { ...base().configuracion, fecha } }).plan).toBeNull()
  })
  it.each(['', '25:00', '10:60', '9:0'])('rechaza hora inválida %s', horaInicio => {
    expect(calcularPlanTekit({ ...base(), configuracion: { ...base().configuracion, horaInicio } }).plan).toBeNull()
  })
  it('rechaza modalidad, modo, selección desconocida y duplicados antes de recomendar', () => {
    expect(calcularPlanTekit({ ...base(), configuracion: { ...base().configuracion, estancia: 'otra' } }).errores.join()).toContain('modalidad válida')
    expect(calcularPlanTekit({ ...base(), modo: 'otro' }).errores.join()).toContain('modo válido')
    for (const seleccion of [['izamal'], ['parroquia', 'parroquia']]) {
      expect(calcularPlanTekit({ ...base(), modo: 'recomendado', seleccion }).errores.join()).toContain('desconocidos o repetidos')
    }
    expect(calcularPlanTekit({ ...base(), seleccion: [] }).errores.join()).toContain('Selecciona al menos un lugar')
  })

  it('interpreta calendario y hora locales, incluso al cruzar medianoche', () => {
    const c = { ...base().configuracion, horaInicio: '23:30' }
    const inicio = inicioLocal(c)!
    expect([inicio.getFullYear(), inicio.getMonth(), inicio.getDate(), inicio.getHours(), inicio.getMinutes()]).toEqual([2026, 10, 30, 23, 30])
    const fin = instanteLocal(c, 90)
    expect(fin.getTime() - inicio.getTime()).toBe(90 * 60_000)
    expect([fin.getMonth(), fin.getDate()]).toEqual([11, 1])
  })
})

describe('Borrador reproducible de Tekit', () => {
  it('inicia sin fecha ni resultado, con 240/360 minutos o tiempo pendiente en Compras', () => {
    expect(leerBorradorTekit(new URLSearchParams())).toMatchObject(crearBorradorTekit())
    expect(crearBorradorTekit('dia-completo').configuracion.minutosDisponibles).toBe('540')
    expect(crearBorradorTekit('ruta-textil').configuracion.minutosDisponibles).toBe('')
    expect(crearBorradorTekit('medio-dia', 'personalizado').seleccion).toEqual([])
    expect(crearBorradorTekit().generado).toBe(false)
  })
  it('recupera configuración, modo, orden y resultado mediante URL', () => {
    expect(leerBorradorTekit(parametrosBorradorTekit(base()))).toMatchObject(base())
    const cambiado = cambiarModalidadTekit(base(), 'ruta-textil')
    expect(cambiado.generado).toBe(false)
    expect(cambiado.configuracion.fecha).toBe(base().configuracion.fecha)
    expect(cambiado.seleccion).toEqual(base().seleccion)
  })
  it.each([
    'fecha=2026-11-30&generado=1',
    'estancia=medio-dia&generado=1',
    'estancia=otra&fecha=2026-11-30&inicio=10:20&minutos=240&generado=1',
    'estancia=medio-dia&fecha=2026-11-30&inicio=10:20&minutos=240&minutos=360&generado=1',
    'estancia=medio-dia&fecha=2026-11-30&inicio=10:20&minutos=240&modo=otro&generado=1',
    'estancia=medio-dia&fecha=2026-11-30&inicio=10:20&minutos=240&generado=2',
    'estancia=medio-dia&fecha=2026-11-30&inicio=10:20&minutos=240&generado=1&generado=0',
    'estancia=medio-dia&fecha=2026-11-30&inicio=10:20&minutos=240&destino=izamal&generado=1',
    'estancia=medio-dia&fecha=2026-11-30&inicio=10:20&minutos=240&lugares=parroquia&lugares=taller-bordado&generado=1',
  ])('rechaza parámetros parciales o manipulados sin completar la configuración: %s', texto => {
    const r = calcularPlanTekit(leerBorradorTekit(new URLSearchParams(texto)))
    expect(r.plan).toBeNull()
    expect(r.errores.length).toBeGreaterThan(0)
  })
})
