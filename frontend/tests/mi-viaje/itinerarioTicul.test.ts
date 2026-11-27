import { describe, expect, it } from 'vitest'
import { lugaresTicul, avisoTrasladoComidaTicul } from '../../src/features/mi-viaje/data/lugaresTicul'
import { calcularPlanTicul, resumirSeleccionTicul, validarConfiguracionTicul } from '../../src/features/mi-viaje/plan/itinerarioTicul'
import { cambiarModalidadTicul, crearBorradorTicul, leerBorradorTicul, parametrosBorradorTicul } from '../../src/features/mi-viaje/plan/borradorTicul'
import { inicioLocal, instanteLocal } from '../../src/features/mi-viaje/plan/tiempoLocal'
import type { BorradorTicul } from '../../src/features/mi-viaje/plan/itinerarioTicul'

function visita(): BorradorTicul {
  const b = crearBorradorTicul('medio-dia', 'personalizado')
  return { ...b, configuracion: { ...b.configuracion, fecha: '2026-11-30', minutosDisponibles: '300' }, seleccion: lugaresTicul.map(l => l.id), generado: true }
}
describe('Cálculo de Ticul CU-09 / RF09', () => {
  it('suma visitas, tipos de traslado, regreso a pie y margen, incluyendo el supuesto de comida', () => {
    expect(lugaresTicul.map(l => [l.visitaMinutos, l.trasladoMinutos, l.traslado.tipo])).toEqual([[60, 3, 'mototaxi'], [60, 5, 'a-pie'], [60, 4, 'a-pie'], [30, 2, 'a-pie']])
    const p = calcularPlanTicul(visita()).plan!
    expect(p).toMatchObject({ visitasMinutos: 210, trasladosMinutos: 17, margenMinutos: 15, totalMinutos: 242, libresMinutos: 58 })
    expect(p.bloques[0].titulo).toContain('Mototaxi')
    expect(p.bloques[2].titulo).toContain('A pie')
    expect(p.bloques[4].titulo).toContain('supuesto demostrativo')
    expect(p.bloques.slice(-2)).toMatchObject([{ titulo: 'Caminata final estimada al punto de regreso', inicio: 224, fin: 227 }, { tipo: 'margen', inicio: 227, fin: 242 }])
    expect(avisoTrasladoComidaTicul).toContain('4 min a pie como supuesto')
  })
  it('no fuerza las cuatro visitas en medio día: explica los dos minutos de exceso sin quitar ni recortar', () => {
    const b = visita(); b.configuracion.minutosDisponibles = '240'
    const antes = structuredClone(b)
    expect(calcularPlanTicul(b)).toEqual({ plan: null, errores: [expect.stringContaining('excede el tiempo disponible por 2 min')] })
    expect(b).toEqual(antes)
    expect(resumirSeleccionTicul(b.seleccion).totalMinutos).toBe(242)
  })
  it('recomienda tres visitas completas en medio día y deja tiempo libre real', () => {
    const b = visita(); b.modo = 'recomendado'; b.configuracion.minutosDisponibles = '240'
    expect(calcularPlanTicul(b).plan).toMatchObject({ seleccion: ['talleres-alfareros', 'corredor-calzado', 'comida-mercado'], totalMinutos: 210, libresMinutos: 30, margenMinutos: 15 })
  })
  it('genera bloques enteros, contiguos y sin solapamientos ni visitas repetidas', () => {
    const b = visita(), p = calcularPlanTicul(b).plan!
    p.bloques.forEach((bloque, i) => {
      expect(Number.isInteger(bloque.inicio) && Number.isInteger(bloque.fin)).toBe(true)
      expect(bloque.fin).toBeGreaterThan(bloque.inicio)
      expect(bloque.inicio).toBe(i ? p.bloques[i - 1].fin : 0)
    })
    expect(p.bloques.reduce((s, bloque) => s + bloque.fin - bloque.inicio, 0)).toBe(242)
    expect(p.bloques.at(-1)!.fin + p.libresMinutos).toBe(300)
    expect(new Set(p.seleccion).size).toBe(p.seleccion.length)
    b.configuracion.minutosDisponibles = '242'
    expect(calcularPlanTicul(b).plan!.libresMinutos).toBe(0)
  })
  it.each([50, 80, 81, 146, 180, 240, 300, 720])('elige una combinación que cabe en %i minutos, sin inventar negocios', minutos => {
    const b = visita(); b.modo = 'recomendado'; b.configuracion.minutosDisponibles = String(minutos)
    const p = calcularPlanTicul(b).plan!
    expect(p).not.toBeNull()
    expect(p.totalMinutos).toBeLessThanOrEqual(minutos)
    expect(p.seleccion.length).toBeLessThanOrEqual(4)
    expect(p.seleccion.every(id => lugaresTicul.some(l => l.id === id))).toBe(true)
  })
  it.each(['dia-completo', 'tour-compras'] as const)('%s conserva el presupuesto común o la modalidad histórica pendiente', estancia => {
    const b = cambiarModalidadTicul(visita(), estancia)
    if (estancia === 'dia-completo') expect(b.configuracion.minutosDisponibles).toBe('540')
    else {
      expect(b.configuracion.minutosDisponibles).toBe('')
      expect(calcularPlanTicul(b).errores.join()).toContain('no tiene duración fija')
    }
    b.configuracion.minutosDisponibles = '300'; b.modo = 'recomendado'
    expect(calcularPlanTicul(b).plan).not.toBeNull()
    expect(calcularPlanTicul(b).plan!.seleccion.every(id => lugaresTicul.some(l => l.id === id))).toBe(true)
  })
  it('Compras recomienda alfarería y calzado sin agregar automáticamente comida o patrimonio', () => {
    const b = cambiarModalidadTicul(visita(), 'tour-compras'); b.configuracion.minutosDisponibles = '300'; b.modo = 'recomendado'
    expect(calcularPlanTicul(b).plan).toMatchObject({ seleccion: ['talleres-alfareros', 'corredor-calzado'], totalMinutos: 146, libresMinutos: 154 })
    expect(calcularPlanTicul({ ...b, modo: 'personalizado', seleccion: ['comida-mercado'] }).plan!.seleccion).toEqual(['comida-mercado'])
    b.configuracion.minutosDisponibles = '80'
    expect(calcularPlanTicul(b).plan).toBeNull()
  })
  it('rechaza falta de tiempo, selección vacía, desconocidos, duplicados y modos inválidos', () => {
    for (const seleccion of [[], ['zaci'], ['corredor-calzado', 'corredor-calzado']]) expect(calcularPlanTicul({ ...visita(), seleccion }).plan).toBeNull()
    expect(calcularPlanTicul({ ...visita(), modo: 'otro' }).errores.join()).toContain('modo válido')
    const b = visita(); b.modo = 'recomendado'; b.configuracion.minutosDisponibles = '49'
    expect(calcularPlanTicul(b).errores.join()).toContain('No cabe una visita completa')
    expect(calcularPlanTicul({ ...b, seleccion: ['izamal'] }).errores.join()).toContain('desconocidos')
  })
  it.each([
    ['fecha', '', 'fecha válida'], ['fecha', '2026-02-30', 'fecha válida'],
    ['horaInicio', '', 'hora de inicio válida'], ['horaInicio', '25:00', 'hora de inicio válida'],
    ['minutosDisponibles', '12.5', 'número entero'], ['minutosDisponibles', '1e2', 'número entero'],
    ['minutosDisponibles', '-1', 'número entero'], ['minutosDisponibles', '721', 'número entero'],
    ['estancia', '__proto__', 'modalidad válida'],
  ])('valida %s=%s antes de calcular', (campo, valor, mensaje) => {
    const b = visita(); b.configuracion = { ...b.configuracion, [campo]: valor }
    expect(validarConfiguracionTicul(b.configuracion).join()).toContain(mensaje)
    expect(calcularPlanTicul(b).plan).toBeNull()
  })
  it('interpreta el calendario y hora local del navegador, incluyendo un cambio de fecha', () => {
    const c = { ...visita().configuracion, horaInicio: '23:30' }
    const inicio = inicioLocal(c)!, fin = instanteLocal(c, 90)
    expect([inicio.getFullYear(), inicio.getMonth(), inicio.getDate(), inicio.getHours(), inicio.getMinutes()]).toEqual([2026, 10, 30, 23, 30])
    expect(fin.getTime() - inicio.getTime()).toBe(90 * 60_000)
    expect([fin.getMonth(), fin.getDate()]).toEqual([11, 1])
  })
})

describe('Borrador reproducible de Ticul', () => {
  it('inicia sin selección, fecha ni resultado y con minutos pendientes en las dos modalidades especiales', () => {
    expect(leerBorradorTicul(new URLSearchParams())).toMatchObject(crearBorradorTicul())
    expect(crearBorradorTicul()).toMatchObject({ seleccion: [], generado: false, configuracion: { minutosDisponibles: '270', fecha: '' } })
    expect(crearBorradorTicul('dia-completo').configuracion.minutosDisponibles).toBe('540')
    expect(crearBorradorTicul('tour-compras').configuracion.minutosDisponibles).toBe('')
  })
  it('recarga configuración y orden de selección; cambiar modalidad conserva fecha y selección e invalida', () => {
    const b = visita(); b.seleccion.reverse()
    expect(leerBorradorTicul(parametrosBorradorTicul(b))).toMatchObject(b)
    expect(cambiarModalidadTicul(b, 'tour-compras')).toMatchObject({ generado: false, seleccion: b.seleccion, configuracion: { fecha: b.configuracion.fecha, minutosDisponibles: '' } })
  })
  it.each(['fecha=2026-11-30&generado=1', 'estancia=dia-completo&generado=1', 'modo=otro', 'generado=si', 'inicio=09:00&inicio=10:00&generado=1', 'lugares=corredor-calzado&lugares=comida-mercado', 'destino=tekit&generado=1'])('rechaza parámetros incompletos o manipulados: %s', p => {
    expect(calcularPlanTicul(leerBorradorTicul(new URLSearchParams(p))).plan).toBeNull()
  })
  it.each(['modo=otro', 'modo=recomendado&modo=personalizado', 'generado=si', 'generado=1&generado=0', 'destino=izamal', 'lugares=corredor-calzado&lugares=comida-mercado', 'minutos=240'])('rechaza valores manipulados aun con el resto de configuración completa: %s', extra => {
    const p = parametrosBorradorTicul(visita())
    const manipulado = new URLSearchParams(`${p}&${extra}`)
    expect(calcularPlanTicul(leerBorradorTicul(manipulado)).plan).toBeNull()
  })
})
