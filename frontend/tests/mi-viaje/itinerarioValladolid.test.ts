import { describe, expect, it } from 'vitest'
import { calcularPlanValladolid, resumirJornadaValladolid, validarConfiguracionValladolid } from '../../src/features/mi-viaje/plan/itinerarioValladolid'
import { cambiarEstanciaValladolid, crearBorradorValladolid, leerBorradorValladolid, parametrosBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { fechaLocal, instanteLocal, siguienteFechaLocal } from '../../src/features/mi-viaje/plan/tiempoLocal'
import type { BorradorValladolid } from '../../src/features/mi-viaje/plan/itinerarioValladolid'

function visita(estancia: 'medio-dia' | 'dia-completo' | 'fin-de-semana' = 'dia-completo'): BorradorValladolid {
  const b = crearBorradorValladolid(estancia, 'personalizado')
  return { ...b, configuracion: { ...b.configuracion, fecha: '2026-12-31' }, seleccion: [{ lugarId: 'zaci', dia: 1 }, { lugarId: 'mercado-donato', dia: 1 }, { lugarId: 'calzada-frailes', dia: 1 }, { lugarId: 'san-bernardino', dia: 1 }] }
}

describe('Cálculo de Valladolid CU-09 / RF09', () => {
  it('inicia con 270 o 540 minutos y dos ventanas separadas para fin de semana', () => {
    expect(crearBorradorValladolid().configuracion.minutosDisponibles).toBe('270')
    expect(crearBorradorValladolid('dia-completo').configuracion.minutosDisponibles).toBe('540')
    expect(crearBorradorValladolid('fin-de-semana').configuracion).toMatchObject({ minutosDisponibles: '270', minutosDia2: '270' })
    expect(crearBorradorValladolid('fin-de-semana', 'personalizado')).toMatchObject({ seleccion: [], generado: false })
  })

  it('suma las visitas originales, los traslados, el traslado final y el margen de 15 minutos', () => {
    const b = visita()
    const resultado = calcularPlanValladolid(b)
    expect(resultado.errores).toEqual([])
    expect(resultado.plan!.jornadas[0]).toMatchObject({ visitasMinutos: 240, trasladosMinutos: 20, margenMinutos: 15, totalMinutos: 275, libresMinutos: 265 })
    expect(resumirJornadaValladolid(b.seleccion.map(s => s.lugarId)).totalMinutos).toBe(275)
    expect(resultado.plan!.jornadas[0].bloques.slice(-2)).toMatchObject([{ tipo: 'traslado', inicio: 255, fin: 260 }, { tipo: 'margen', inicio: 260, fin: 275 }])
  })

  it('rechaza un exceso sin eliminar visitas', () => {
    const b = visita('medio-dia')
    const antes = structuredClone(b)
    expect(calcularPlanValladolid(b)).toEqual({ plan: null, errores: ['Día 1: la selección excede el tiempo disponible por 5 min. Modifica esa jornada; no se ha eliminado ninguna visita.'] })
    expect(b).toEqual(antes)
  })

  it('acepta exactamente el tiempo necesario, sin omitir el traslado final ni el margen', () => {
    const b = visita()
    b.configuracion.minutosDisponibles = '275'
    expect(calcularPlanValladolid(b).plan!.jornadas[0]).toMatchObject({ totalMinutos: 275, libresMinutos: 0 })
  })

  it('recomienda una combinación completa que cabe en cada ventana', () => {
    const b = visita('medio-dia')
    b.modo = 'recomendado'
    const plan = calcularPlanValladolid(b).plan!
    expect(plan.seleccion).toHaveLength(3)
    expect(plan.jornadas[0].totalMinutos).toBeLessThanOrEqual(270)
    b.configuracion.minutosDisponibles = '15'
    expect(calcularPlanValladolid(b).plan).toBeNull()
    expect(calcularPlanValladolid(b).errores.join(' ')).toContain('Amplía la ventana')
  })

  it('calcula dos jornadas, sin duplicar lugares ni visitar durante la noche', () => {
    const b = visita('fin-de-semana')
    b.modo = 'recomendado'
    const plan = calcularPlanValladolid(b).plan!
    expect(plan.jornadas.map(d => d.fecha)).toEqual(['2026-12-31', '2027-01-01'])
    expect(plan.jornadas).toHaveLength(2)
    expect(plan.seleccion).toHaveLength(4)
    expect(new Set(plan.seleccion.map(s => s.lugarId)).size).toBe(4)
    for (const dia of plan.jornadas) {
      expect(dia.seleccion.length).toBeGreaterThan(0)
      expect(dia.totalMinutos).toBeLessThanOrEqual(Number(dia.minutosDisponibles))
      expect(dia.margenMinutos).toBe(15)
      expect(dia.bloques.at(-2)!.fin - dia.bloques.at(-2)!.inicio).toBe(5)
      dia.bloques.forEach((bloque, i) => {
        expect(Number.isInteger(bloque.inicio) && Number.isInteger(bloque.fin)).toBe(true)
        expect(bloque.fin).toBeGreaterThan(bloque.inicio)
        expect(bloque.inicio).toBe(i === 0 ? 0 : dia.bloques[i - 1].fin)
        expect(fechaLocal(instanteLocal(dia, bloque.fin))).toBe(dia.fecha)
      })
    }
  })

  it('rechaza por separado el exceso del Día 1 aunque el Día 2 tenga tiempo libre', () => {
    const b = visita('fin-de-semana')
    b.configuracion.minutosDisponibles = '120'
    b.configuracion.minutosDia2 = '540'
    b.seleccion[3].dia = 2
    expect(calcularPlanValladolid(b).plan).toBeNull()
    expect(calcularPlanValladolid(b).errores).toEqual(['Día 1: la selección excede el tiempo disponible por 1 h 52 min. Modifica esa jornada; no se ha eliminado ninguna visita.'])
  })

  it('encuentra una recomendación con ventanas asimétricas y explica cuándo no caben ambas jornadas', () => {
    const b = visita('fin-de-semana')
    b.modo = 'recomendado'
    b.configuracion.minutosDisponibles = '63'
    const plan = calcularPlanValladolid(b).plan!
    expect(plan.jornadas[0].seleccion).toEqual(['san-bernardino'])
    expect(plan.jornadas[1].seleccion).toHaveLength(3)
    b.configuracion.minutosDia2 = '15'
    expect(calcularPlanValladolid(b).plan).toBeNull()
    expect(calcularPlanValladolid(b).errores.join(' ')).toContain('No hay una combinación que quepa en cada jornada')
  })

  it('exige selección en cada jornada y rechaza repetidos, destinos ajenos y asignaciones inválidas', () => {
    const b = visita('fin-de-semana')
    b.seleccion = [{ lugarId: 'zaci', dia: 1 }]
    expect(calcularPlanValladolid(b).errores.join(' ')).toContain('Día 2: selecciona al menos un lugar')
    for (const seleccion of [[{ lugarId: 'zaci', dia: 1 }, { lugarId: 'zaci', dia: 2 }], [{ lugarId: 'kinich', dia: 1 }], [{ lugarId: 'zaci', dia: 3 }]]) {
      expect(calcularPlanValladolid({ ...b, seleccion }).errores.join(' ')).toContain('desconocidos, repetidos o asignados')
    }
    expect(calcularPlanValladolid({ ...b, seleccion: [] }).plan).toBeNull()
  })

  it.each([
    ['fecha', '2026-02-30', 'fecha válida'], ['horaInicio', '', 'hora de inicio válida'],
    ['horaInicio', '25:00', 'hora de inicio válida'], ['minutosDisponibles', '2.5', 'número entero'],
    ['minutosDisponibles', '2880', 'número entero'], ['minutosDisponibles', '-20', 'número entero'],
    ['horaInicio', '23:00', 'sin visitas nocturnas'], ['horaInicio', '05:00', 'sin visitas nocturnas'],
    ['estancia', '__proto__', 'estancia válida'],
  ])('valida %s=%s sin producir un plan', (campo, valor, mensaje) => {
    const b = visita()
    const config = { ...b.configuracion, [campo]: valor }
    expect(validarConfiguracionValladolid(config).join(' ')).toContain(mensaje)
    expect(calcularPlanValladolid({ ...b, configuracion: config }).plan).toBeNull()
  })

  it('valida también el inicio y la duración de la segunda jornada y los cruces de medianoche', () => {
    const b = visita('fin-de-semana')
    b.configuracion.horaInicioDia2 = '21:00'
    b.configuracion.minutosDia2 = '270'
    expect(validarConfiguracionValladolid(b.configuracion).join(' ')).toContain('Día 2: la ventana')
    b.configuracion.horaInicioDia2 = ''
    b.configuracion.minutosDia2 = ''
    expect(validarConfiguracionValladolid(b.configuracion)).toHaveLength(2)
  })

  it.each([['2026-12-31', '2027-01-01'], ['2028-02-28', '2028-02-29'], ['2028-02-29', '2028-03-01'], ['2026-03-08', '2026-03-09'], ['2026-11-01', '2026-11-02']])('avanza por calendario local de %s a %s', (fecha, siguiente) => {
    expect(siguienteFechaLocal(fecha)).toBe(siguiente)
  })
})

describe('Borrador de Valladolid en URL', () => {
  it('recupera configuración, jornadas, selección y generación sin datos de cuenta', () => {
    const b = visita('fin-de-semana')
    b.seleccion[2].dia = 2
    b.seleccion[3].dia = 2
    b.generado = true
    expect(leerBorradorValladolid(parametrosBorradorValladolid(b))).toEqual(b)
  })

  it.each(['estancia=otra&generado=1', 'estancia=fin-de-semana&fecha=2026-11-30&generado=1', 'estancia=medio-dia&inicio=10:00&inicio=11:00&generado=1', 'modo=otro', 'generado=si', 'dia1=zaci&dia1=mercado-donato'])('rechaza parámetros incompletos o manipulados: %s', consulta => {
    expect(calcularPlanValladolid(leerBorradorValladolid(new URLSearchParams(consulta))).plan).toBeNull()
  })

  it('cambiar estancia invalida el resultado y conserva visitas al pasar a una jornada', () => {
    const b = visita('fin-de-semana')
    b.seleccion[3].dia = 2
    b.generado = true
    const nuevo = cambiarEstanciaValladolid(b, 'dia-completo')
    expect(nuevo.generado).toBe(false)
    expect(nuevo.configuracion.minutosDisponibles).toBe('540')
    expect(nuevo.seleccion).toEqual(b.seleccion.map(s => ({ ...s, dia: 1 })))
  })
})
