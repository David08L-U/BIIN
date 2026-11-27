import { describe, expect, it } from 'vitest'
import { estanciasCompartidas } from '../../src/features/mi-viaje/plan/estanciasCompartidas'
import { crearBorradorHomun, parametrosBorradorHomun, leerBorradorHomun } from '../../src/features/mi-viaje/plan/borradorHomun'
import { calcularPlanHomun } from '../../src/features/mi-viaje/plan/itinerarioHomun'
import { parametrosBorrador, leerBorradorIzamal } from '../../src/features/mi-viaje/plan/borradorIzamal'
import { calcularPlan as calcularPlanIzamal } from '../../src/features/mi-viaje/plan/itinerarioIzamal'
import { crearBorradorTekit, parametrosBorradorTekit, leerBorradorTekit } from '../../src/features/mi-viaje/plan/borradorTekit'
import { calcularPlanTekit } from '../../src/features/mi-viaje/plan/itinerarioTekit'
import { crearBorradorTicul, parametrosBorradorTicul, leerBorradorTicul } from '../../src/features/mi-viaje/plan/borradorTicul'
import { calcularPlanTicul } from '../../src/features/mi-viaje/plan/itinerarioTicul'
import { crearBorradorValladolid, parametrosBorradorValladolid, leerBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { calcularPlanValladolid } from '../../src/features/mi-viaje/plan/itinerarioValladolid'
import { textoPlanHomun } from '../../src/features/mi-viaje/plan/accionesHomun'
import { textoPlanTekit } from '../../src/features/mi-viaje/plan/accionesTekit'
import { textoPlanTicul } from '../../src/features/mi-viaje/plan/accionesTicul'
import { textoPlanValladolid } from '../../src/features/mi-viaje/plan/accionesValladolid'

const modulos = [
  { nombre: 'Izamal', opciones: estanciasCompartidas, crear: (estancia: string) => leerBorradorIzamal(new URLSearchParams(`estancia=${estancia}`)), leer: leerBorradorIzamal, serializar: parametrosBorrador, calcular: calcularPlanIzamal, texto: undefined },
  { nombre: 'Valladolid', opciones: estanciasCompartidas, crear: crearBorradorValladolid, leer: leerBorradorValladolid, serializar: parametrosBorradorValladolid, calcular: calcularPlanValladolid, texto: textoPlanValladolid },
  { nombre: 'Tekit', opciones: estanciasCompartidas, crear: crearBorradorTekit, leer: leerBorradorTekit, serializar: parametrosBorradorTekit, calcular: calcularPlanTekit, texto: textoPlanTekit },
  { nombre: 'Homún', opciones: estanciasCompartidas, crear: crearBorradorHomun, leer: leerBorradorHomun, serializar: parametrosBorradorHomun, calcular: calcularPlanHomun, texto: textoPlanHomun },
  { nombre: 'Ticul', opciones: estanciasCompartidas, crear: crearBorradorTicul, leer: leerBorradorTicul, serializar: parametrosBorradorTicul, calcular: calcularPlanTicul, texto: textoPlanTicul },
]

describe('estancias compartidas en los cinco planificadores', () => {
  it('ofrece los mismos presupuestos editables en todos los destinos', () => {
    expect(estanciasCompartidas).toMatchObject({
      'medio-dia': { minutos: '270', hora: '09:00' },
      'dia-completo': { minutos: '540', hora: '09:00' },
      'fin-de-semana': { minutos: '540', hora: '09:00' },
    })
    for (const modulo of modulos) {
      for (const estancia of Object.keys(estanciasCompartidas) as (keyof typeof estanciasCompartidas)[]) {
        const borrador = modulo.crear(estancia)
        expect(borrador.configuracion.estancia, modulo.nombre).toBe(estancia)
        expect(borrador.configuracion.minutosDisponibles, modulo.nombre).toBe(estanciasCompartidas[estancia].minutos)
        if (estancia === 'fin-de-semana') expect(borrador.configuracion.minutosDia2, modulo.nombre).toBe('540')
      }
    }
  })

  it.each(modulos)('$nombre conserva el fin de semana en URL y calcula una llegada y un regreso final', modulo => {
    const borrador = modulo.crear('fin-de-semana')
    borrador.configuracion.fecha = '2026-12-01'
    borrador.generado = true
    const restaurado = modulo.leer(modulo.serializar(borrador))
    expect(restaurado.configuracion).toMatchObject({ estancia: 'fin-de-semana', fecha: '2026-12-01', minutosDisponibles: '540', minutosDia2: '540' })
    const resultado = modulo.calcular(restaurado, '2026-11-26')
    expect(resultado.errores, modulo.nombre).toEqual([])
    const plan = resultado.plan!
    expect(plan.jornadas?.map(dia => dia.fecha), modulo.nombre).toEqual(['2026-12-01', '2026-12-02'])
    expect(plan.jornadas?.map(dia => dia.minutosDisponibles), modulo.nombre).toEqual(['540', '540'])
    expect(plan.jornadas?.[0].bloques.some(bloque => bloque.tipo === 'traslado' && !bloque.lugarId), modulo.nombre).toBe(false)
    expect(plan.jornadas?.[1].bloques.filter(bloque => bloque.tipo === 'traslado' && !bloque.lugarId), modulo.nombre).toHaveLength(1)
    if (modulo.texto) {
      const texto = modulo.texto(restaurado, plan)
      expect(texto.match(/Llegada al destino el Día 1/g), modulo.nombre).toHaveLength(1)
      expect(texto.match(/único regreso al final del último día/g), modulo.nombre).toHaveLength(1)
      expect(texto.match(/Día 1 · 2026-12-01/g), modulo.nombre).toHaveLength(1)
      expect(texto.match(/Día 2 · 2026-12-02/g), modulo.nombre).toHaveLength(1)
    }
  })
})
