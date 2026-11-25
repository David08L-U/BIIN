import { describe, expect, it } from 'vitest'
import { lugaresHomun, avisoRegresoHomun } from '../../src/features/mi-viaje/data/lugaresHomun'
import { calcularPlanHomun, resumirJornadaHomun, validarConfiguracionHomun } from '../../src/features/mi-viaje/plan/itinerarioHomun'
import { cambiarEstanciaHomun, crearBorradorHomun, leerBorradorHomun, parametrosBorradorHomun } from '../../src/features/mi-viaje/plan/borradorHomun'
import { fechaLocal, inicioLocal, instanteLocal } from '../../src/features/mi-viaje/plan/tiempoLocal'
import { crearBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { calcularPlanValladolid } from '../../src/features/mi-viaje/plan/itinerarioValladolid'
import type { BorradorHomun } from '../../src/features/mi-viaje/plan/itinerarioHomun'

function visita(estancia: 'medio-dia' | 'dia-completo' | 'fin-de-semana' = 'medio-dia'): BorradorHomun {
  const b = crearBorradorHomun(estancia, 'personalizado')
  return { ...b, configuracion: { ...b.configuracion, fecha: '2026-12-31' }, seleccion: lugaresHomun.map(l => ({ lugarId: l.id, dia: 1 })), generado: true }
}

describe('Cálculo de Homún por jornadas CU-09 / RF09', () => {
  it('suma las visitas originales, cada tipo de traslado, regreso supuesto y margen', () => {
    expect(lugaresHomun.map(l => [l.visitaMinutos, l.trasladoMinutos, l.traslado.tipo])).toEqual([[75, 3, 'mototaxi'], [65, 5, 'senderos'], [60, 4, 'mototaxi'], [35, 2, 'a-pie']])
    const d = calcularPlanHomun(visita()).plan!.jornadas[0]
    expect(d).toMatchObject({ visitasMinutos: 235, trasladosMinutos: 19, margenMinutos: 15, totalMinutos: 269, libresMinutos: 1 })
    expect(d.bloques.filter(b => b.tipo === 'traslado').map(b => b.fin - b.inicio)).toEqual([3, 5, 4, 2, 5])
    expect(d.bloques[0].titulo).toContain('Mototaxi')
    expect(d.bloques[2].titulo).toContain('entre senderos')
    expect(d.bloques[6].titulo).toContain('A pie')
    expect(d.bloques.at(-2)!.titulo).toContain('supuesto de 5 min')
    expect(avisoRegresoHomun).toContain('el HTML no define')
  })
  it('mantiene minutos enteros y bloques contiguos, sin solaparse ni superar la ventana', () => {
    const d = calcularPlanHomun(visita()).plan!.jornadas[0]
    d.bloques.forEach((b, i) => {
      expect(Number.isInteger(b.inicio) && Number.isInteger(b.fin)).toBe(true)
      expect(b.fin).toBeGreaterThan(b.inicio)
      expect(b.inicio).toBe(i ? d.bloques[i - 1].fin : 0)
      expect(fechaLocal(instanteLocal(d, b.fin))).toBe(d.fecha)
    })
    expect(d.bloques.reduce((s, b) => s + b.fin - b.inicio, 0)).toBe(269)
    expect(d.bloques.at(-1)!.fin + d.libresMinutos).toBe(270)
  })
  it('acepta el tiempo exacto y explica el exceso sin recortar ni eliminar lugares', () => {
    const b = visita()
    b.configuracion.minutosDisponibles = '269'
    expect(calcularPlanHomun(b).plan!.jornadas[0].libresMinutos).toBe(0)
    b.configuracion.minutosDisponibles = '265'
    const antes = structuredClone(b)
    expect(calcularPlanHomun(b)).toEqual({ plan: null, errores: [expect.stringContaining('Día 1: la selección excede el tiempo disponible por 4 min')] })
    expect(b).toEqual(antes)
    expect(resumirJornadaHomun(b.seleccion.map(s => s.lugarId)).totalMinutos).toBe(269)
  })
  it.each([57, 80, 120, 180, 270, 540, 720])('recomienda visitas completas que caben en %i minutos, sin rellenar con negocios inventados', minutos => {
    const b = visita()
    b.modo = 'recomendado'; b.configuracion.minutosDisponibles = String(minutos)
    const plan = calcularPlanHomun(b).plan!
    expect(plan).not.toBeNull()
    expect(plan.jornadas[0].totalMinutos).toBeLessThanOrEqual(minutos)
    expect(plan.seleccion.length).toBeLessThanOrEqual(4)
    expect(new Set(plan.seleccion.map(s => s.lugarId)).size).toBe(plan.seleccion.length)
  })
  it('deja tiempo libre real y explica cuándo no cabe ninguna visita', () => {
    const b = visita('dia-completo')
    b.modo = 'recomendado'
    expect(calcularPlanHomun(b).plan!.jornadas[0]).toMatchObject({ totalMinutos: 269, libresMinutos: 271 })
    b.configuracion.minutosDisponibles = '56'
    expect(calcularPlanHomun(b).plan).toBeNull()
    expect(calcularPlanHomun(b).errores.join()).toContain('No hay una combinación')
  })
  it('usa dos fechas locales consecutivas con margen por jornada, sin repetir lugares', () => {
    const b = visita('fin-de-semana'); b.modo = 'recomendado'
    const plan = calcularPlanHomun(b).plan!
    expect(plan.jornadas.map(d => d.fecha)).toEqual(['2026-12-31', '2027-01-01'])
    expect(plan.jornadas.map(d => d.margenMinutos)).toEqual([15, 15])
    expect(new Set(plan.seleccion.map(s => s.lugarId)).size).toBe(4)
    expect(plan.jornadas.reduce((s, d) => s + d.totalMinutos, 0)).toBe(289)
    for (const d of plan.jornadas) {
      expect(d.seleccion.length).toBeGreaterThan(0)
      expect(d.totalMinutos).toBeLessThanOrEqual(Number(d.minutosDisponibles))
      expect(d.bloques.at(-2)!.fin - d.bloques.at(-2)!.inicio).toBe(5)
    }
  })
  it('valida cada jornada sin compensar el exceso con tiempo del otro día', () => {
    const b = visita('fin-de-semana')
    b.configuracion.minutosDisponibles = '120'; b.configuracion.minutosDia2 = '540'
    b.seleccion[3].dia = 2
    expect(calcularPlanHomun(b).errores).toEqual([expect.stringContaining('Día 1: la selección excede el tiempo disponible por 1 h 52 min')])
    expect(b.seleccion).toHaveLength(4)
  })
  it('encuentra combinaciones para ventanas asimétricas o pide ampliar la jornada insuficiente', () => {
    const b = visita('fin-de-semana'); b.modo = 'recomendado'; b.configuracion.minutosDisponibles = '57'
    const plan = calcularPlanHomun(b).plan!
    expect(plan.jornadas[0].seleccion).toEqual(['plaza-parroquia'])
    expect(plan.jornadas[1].seleccion).toHaveLength(3)
    b.configuracion.minutosDia2 = '56'
    expect(calcularPlanHomun(b).plan).toBeNull()
  })
  it('exige selección por jornada y rechaza lugares ajenos, repetidos o asignados a otro día', () => {
    const b = visita('fin-de-semana')
    expect(calcularPlanHomun({ ...b, seleccion: [{ lugarId: 'santa-rosa', dia: 1 }] }).errores.join()).toContain('Día 2: selecciona al menos un lugar')
    for (const seleccion of [[{ lugarId: 'zaci', dia: 1 }], [{ lugarId: 'santa-rosa', dia: 1 }, { lugarId: 'santa-rosa', dia: 2 }], [{ lugarId: 'santa-rosa', dia: 3 }]]) expect(calcularPlanHomun({ ...b, seleccion }).errores.join()).toContain('desconocidos, repetidos o asignados')
    expect(calcularPlanHomun({ ...visita(), seleccion: [] }).plan).toBeNull()
  })
  it.each([
    ['estancia', '__proto__', 'estancia válida'], ['fecha', '2026-02-30', 'fecha válida'],
    ['horaInicio', '25:00', 'hora de inicio válida'], ['minutosDisponibles', '1e2', 'número entero'],
    ['minutosDisponibles', '12.5', 'número entero'], ['minutosDisponibles', '2880', 'número entero'],
    ['horaInicio', '05:59', 'sin visitas nocturnas'], ['horaInicio', '21:00', 'sin visitas nocturnas'],
    ['horaInicioDia2', '', 'Día 2: elige una hora'], ['minutosDia2', '0', 'Día 2: el tiempo'],
  ])('valida %s=%s antes del cálculo', (campo, valor, mensaje) => {
    const b = visita('fin-de-semana'); b.configuracion = { ...b.configuracion, [campo]: valor }
    expect(validarConfiguracionHomun(b.configuracion).join()).toContain(mensaje)
    expect(calcularPlanHomun(b).plan).toBeNull()
  })
  it('construye fecha y hora en el navegador y mantiene Valladolid con sus datos y títulos', () => {
    const inicio = inicioLocal(visita().configuracion)!
    expect([inicio.getFullYear(), inicio.getMonth(), inicio.getDate(), inicio.getHours()]).toEqual([2026, 11, 31, 9])
    const b = crearBorradorValladolid('dia-completo'); b.configuracion.fecha = '2026-12-31'
    const d = calcularPlanValladolid(b).plan!.jornadas[0]
    expect(d).toMatchObject({ totalMinutos: 275, visitasMinutos: 240, trasladosMinutos: 20, libresMinutos: 265 })
    expect(d.bloques.at(-2)!.titulo).toBe('Traslado final estimado al punto de regreso')
    expect(d.seleccion).toEqual(['zaci', 'mercado-donato', 'calzada-frailes', 'san-bernardino'])
  })
})

describe('Borrador de Homún en URL', () => {
  it('inicia vacío, con 270/540 minutos y dos ventanas para fin de semana', () => {
    expect(crearBorradorHomun()).toMatchObject({ generado: false, seleccion: [], configuracion: { fecha: '', minutosDisponibles: '270' } })
    expect(crearBorradorHomun('dia-completo').configuracion.minutosDisponibles).toBe('540')
    expect(crearBorradorHomun('fin-de-semana').configuracion).toMatchObject({ minutosDisponibles: '270', minutosDia2: '270' })
  })
  it('conserva el borrador al recargar y las visitas al pasar a una sola jornada', () => {
    const b = visita('fin-de-semana'); b.seleccion[2].dia = 2; b.seleccion[3].dia = 2
    expect(leerBorradorHomun(parametrosBorradorHomun(b))).toEqual(b)
    const nuevo = cambiarEstanciaHomun(b, 'dia-completo')
    expect(nuevo.generado).toBe(false)
    expect(nuevo.configuracion.minutosDisponibles).toBe('540')
    expect(nuevo.configuracion.fecha).toBe(b.configuracion.fecha)
    expect(nuevo.seleccion).toEqual(b.seleccion.map(s => ({ ...s, dia: 1 })))
  })
  it.each(['fecha=2026-12-31&generado=1', 'estancia=fin-de-semana&fecha=2026-12-31&inicio=09:00&minutos=270&generado=1', 'modo=otro', 'generado=si', 'inicio=09:00&inicio=10:00&generado=1', 'dia1=santa-rosa&dia1=tza-ujun-kat', 'dia1=santa-rosa&dia2=santa-rosa', 'dia3=santa-rosa', 'destino=valladolid&generado=1'])('rechaza parámetros parciales o manipulados: %s', p => {
    expect(calcularPlanHomun(leerBorradorHomun(new URLSearchParams(p))).plan).toBeNull()
  })
})
