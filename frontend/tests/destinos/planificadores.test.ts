import { describe, expect, it } from 'vitest'
import { idsDestino } from '../../src/features/destinos/registroDestinos'
import { planificadores } from '../../src/features/mi-viaje/plan/registroPlanificadores'

describe('Contrato del planificador por destino', () => {
  it.each(idsDestino)('%s conserva selección, orden, horas y enlace en ambas jornadas', id => {
    const adaptador = planificadores[id]
    const [primero, segundo] = adaptador.datos.lugares
    const entrada = new URLSearchParams('estancia=fin-de-semana&fecha=2099-11-30&inicio=09%3A10&minutos=540&inicio2=10%3A15&minutos2=495')
    const seleccion = [{ lugarId: primero.id, dia: 1 }, { lugarId: segundo.id, dia: 2 }]
    const borrador = adaptador.leer(entrada, 'personalizar')
    const personalizada = adaptador.leer(borrador.cambiarSeleccion(seleccion), 'personalizar')
    expect(personalizada.seleccion).toEqual(seleccion)
    expect(personalizada.borrador.generado).toBe(false)

    const resultado = personalizada.calcular()
    expect(resultado.errores).toEqual([])
    expect(resultado.plan).not.toBeNull()
    const url = new URL(resultado.plan!.url, 'https://biin.test')
    expect(url.pathname).toBe(`/rutas/${id}/itinerario`)
    const abierta = adaptador.leer(url.searchParams, 'itinerario')
    expect(abierta.borrador.generado).toBe(true)
    expect(abierta.seleccion).toEqual(seleccion)
    const jornadas = abierta.calcular().plan!.jornadas
    expect(jornadas.map(dia => dia.horaInicio)).toEqual(['09:10', '10:15'])
    expect(jornadas.map(dia => dia.seleccion)).toEqual([[primero.id], [segundo.id]])
    expect(jornadas.map(dia => dia.bloques.filter(bloque => bloque.tipo === 'traslado' && !bloque.lugarId).length)).toEqual([0, 1])
    expect(jornadas.every(dia => dia.bloques.some(bloque => bloque.tipo === 'traslado' && bloque.lugarId))).toBe(true)
    expect(adaptador.leer(resultado.plan!.guardado('servidor:42'), 'itinerario').borrador.editarId).toBe('servidor:42')
  })
})
