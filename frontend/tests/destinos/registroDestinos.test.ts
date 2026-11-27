import '@testing-library/jest-dom/vitest'
import { describe, expect, it } from 'vitest'
import { idsDestino, obtenerDestino } from '../../src/features/destinos/registroDestinos'

describe('contratos locales de destino', () => {
  it('registra los cinco destinos con contenido propio y detalle renderizable', () => {
    expect(idsDestino).toEqual(['izamal', 'valladolid', 'tekit', 'homun', 'ticul'])
    for (const id of idsDestino) {
      const destino = obtenerDestino(id)!
      expect(destino.ruta.id).toBe(id)
      expect(destino.detalle.paradas.length).toBeGreaterThan(1)
      expect(destino.detalle.lugares.length).toBeGreaterThan(0)
      expect(destino.detalle.opciones.map(opcion => opcion.id)).toContain('fin-de-semana')
    }
    expect(obtenerDestino('tekit')?.detalle.referenciaCultural).toContain('Ruta Textil')
    expect(obtenerDestino('ticul')?.detalle.referenciaCultural).toContain('Alfarero')
    expect(obtenerDestino('homun')?.detalle.lugares).toContain('Cenote Santa Rosa')
    expect(obtenerDestino('valladolid')?.detalle.paradas.at(-1)?.nombre).toContain('Valladolid')
  })

  it('conserva las URLs legadas y sus parámetros de configuración', () => {
    for (const id of idsDestino) {
      const destino = obtenerDestino(id)!
      const parametros = new URLSearchParams('fecha=2027-03-10&inicio=09%3A15&minutos=270&modo=personalizado&lugares=plaza')
      expect(destino.urlPlanificador(parametros, 'recomendado')).toMatch(new RegExp(`/rutas/${id}/itinerario\\?`))
      expect(destino.urlPlanificador(parametros, 'personalizado')).toMatch(new RegExp(`/rutas/${id}/personalizar\\?`))
      const regresada = new URL(destino.urlBorrador(parametros, 'detalle'), 'https://biin.local')
      expect(regresada.pathname).toBe(`/rutas/${id}`)
      expect(regresada.searchParams.get('fecha')).toBe('2027-03-10')
      expect(regresada.searchParams.get('minutos')).toBe('270')
    }
  })

  it('reconoce estancias anteriores sin inventar sus duraciones', () => {
    const tekit = obtenerDestino('tekit')!
    const ticul = obtenerDestino('ticul')!
    expect(tekit.leerEstancia(new URLSearchParams('estancia=ruta-textil'))).toBe('ruta-textil')
    expect(ticul.leerEstancia(new URLSearchParams('estancia=tour-compras'))).toBe('tour-compras')
    expect(obtenerDestino('desconocido')).toBeUndefined()
  })
})
