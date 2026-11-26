import { describe, expect, it } from 'vitest'
import { urlAgregarLugar, urlAgregarLugarGuardado } from '../../src/features/mi-viaje/plan/agregarLugarAItinerario'
import { crearBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'

describe('Agregar lugares a planes existentes', () => {
  it.each([
    ['izamal', 'convento'], ['valladolid', 'calzada-frailes'], ['tekit', 'parroquia'], ['homun', 'santa-rosa'], ['ticul', 'iglesia-san-antonio'],
  ] as const)('prepara una edición personalizada de %s conservando configuración', (destino, lugar) => {
    const url = urlAgregarLugar(destino, lugar)
    expect(url).toContain(`/rutas/${destino}/personalizar?`)
    const p = new URLSearchParams(url.split('?')[1])
    expect(p.get('modo')).toBe('personalizado')
    expect(p.has('generado')).toBe(false)
    expect(destino === 'valladolid' || destino === 'homun' ? p.get('dia1') : p.get('lugares')).toContain(lugar)
  })

  it('asigna a día elegido y no duplica al agregar en un guardado', () => {
    const borrador = crearBorradorValladolid('fin-de-semana', 'personalizado')
    borrador.configuracion.fecha = '2026-12-01'
    borrador.configuracion.minutosDisponibles = '540'
    borrador.configuracion.minutosDia2 = '540'
    borrador.seleccion = [{ lugarId: 'mercado-donato', dia: 1 }]
    borrador.generado = true
    localStorage.setItem('biin:itinerarios:v1:5', JSON.stringify({ version: 1, itinerarios: [{ destino: 'valladolid', id: 'v-1', guardadoEn: '2026-11-25T00:00:00.000Z', borrador }] }))
    const guardado = JSON.parse(localStorage.getItem('biin:itinerarios:v1:5')!).itinerarios[0]
    const url = urlAgregarLugarGuardado(guardado, 'calzada-frailes', 2)
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('dia1')).toBe('mercado-donato')
    expect(params.get('dia2')).toBe('calzada-frailes')
    const duplicado = new URLSearchParams(urlAgregarLugarGuardado(guardado, 'mercado-donato', 2).split('?')[1])
    expect(duplicado.get('dia1')).toBe('mercado-donato')
    expect(duplicado.has('dia2')).toBe(false)
    expect(params.get('editar')).toBe('v-1')
  })
})
