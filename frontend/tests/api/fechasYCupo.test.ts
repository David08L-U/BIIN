import { describe, expect, it } from 'vitest'
import { aUtcYucatan, entradaYucatan, fechaValida, moneda } from '../../src/utils/formatoDatos'
import { validarPlanApi, datosCrearPlan, parametrosPlanApi } from '../../src/features/mi-viaje/plan/planApi'
import { cupoVigente, tarifaCompleta } from '../../src/features/transporte/datosRuta'
import type { SalidaConCupo } from '../../src/features/transporte/types'
import { ruta } from './fixtures'

const config = { nombre: 'Visita de prueba', inicio: '2026-12-01', fin: '2026-12-02', horaInicio: '09:00', presupuesto: '0' }
describe('fechas, importes y disponibilidad', () => {
  it('convierte Yucatán a UTC sin depender de la zona del navegador', () => {
    expect(aUtcYucatan('2026-12-01T09:30')).toBe('2026-12-01T15:30:00.000Z')
    expect(entradaYucatan('2026-12-02T02:15:00Z')).toBe('2026-12-01T20:15')
  })
  it.each(['2026-02-30', '2026-13-01', 'no-fecha'])('rechaza la fecha imposible %s', f => expect(fechaValida(f)).toBe(false))
  it('acepta año bisiesto y presupuesto cero', () => {
    expect(fechaValida('2028-02-29')).toBe(true)
    expect(datosCrearPlan(config).presupuestoEstimado).toBe(0)
    expect(moneda(0)).not.toBe('Sin confirmar')
    expect(moneda(null)).toBe('Sin confirmar')
  })
  it('acepta visitas históricas consultables y rechaza rangos inválidos', () => {
    expect(validarPlanApi({ ...config, inicio: '2020-01-01', fin: '2020-01-02' })).toEqual([])
    expect(validarPlanApi({ ...config, fin: '2026-11-30' })).not.toEqual([])
    expect(validarPlanApi({ ...config, fin: '2027-03-01' })).not.toEqual([])
    expect(validarPlanApi({ ...config, presupuesto: '-1' })).not.toEqual([])
    expect(validarPlanApi({ ...config, presupuesto: 'Infinity' })).not.toEqual([])
  })
  it('conserva selección y fechas del borrador al cambiar de modo', () => {
    const params = parametrosPlanApi(config, [2, 1], true)
    expect(params.get('seleccion')).toBe('2,1')
    expect(params.get('inicio')).toBe('2026-12-01')
  })
  it('no presenta una tarifa parcial como precio de toda la ruta', () => {
    const r = ruta(); r.tarifas = [{ idTarifa: 1, idRuta: r.idRuta, ordenOrigen: 1, localidadOrigen: 'A', ordenDestino: 99, localidadDestino: 'B', monto: 10, vigenteDesde: '2020-01-01', vigenteHasta: null }]
    expect(tarifaCompleta(r)).toBeNull()
    r.tarifas[0].ordenDestino = 2; r.tarifas[0].monto = 0
    expect(tarifaCompleta(r)).toBe(0)
  })
  it('considera cero asientos como reporte válido y descarta reportes vencidos', () => {
    const salida: SalidaConCupo = { idSalida: 1, idRuta: 901, unidad: 'PRUEBA', salidaProgramada: '2026-12-01T15:00:00Z', capacidadHabilitada: 10, estadoSalida: 'programada', estadoCupo: 'vigente', asientosDisponibles: 0, registradoEn: '2026-12-01T14:00:00Z', validoHasta: '2026-12-01T14:10:00Z' }
    expect(cupoVigente(salida, Date.parse('2026-12-01T14:05:00Z'))).toBe(true)
    expect(cupoVigente(salida, Date.parse('2026-12-01T14:10:00Z'))).toBe(false)
    expect(cupoVigente({ ...salida, estadoSalida: 'cancelada' }, Date.parse('2026-12-01T14:05:00Z'))).toBe(false)
  })
})
