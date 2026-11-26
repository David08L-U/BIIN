import { describe, expect, it } from 'vitest'
import { buscarLugares, categoriasExplorar, lugaresExplorar } from '../src/features/explorar/data/lugaresExplorar'
import { urlPlanificador } from '../src/features/mi-viaje/plan/urlsPlanificador'

describe('Catálogo compartido de lugares para Explorar', () => {
  it('reutiliza los lugares de los cinco planificadores con identidad destino/lugar', () => {
    expect(new Set(lugaresExplorar.map(l => l.destino))).toEqual(new Set(['izamal', 'valladolid', 'tekit', 'homun', 'ticul']))
    expect(lugaresExplorar.some(l => l.destino === 'izamal' && l.nombre === 'Convento San Antonio de Padua')).toBe(true)
    expect(lugaresExplorar.some(l => l.destino === 'homun' && l.imagen)).toBe(true)
    expect(lugaresExplorar.find(l => l.destino === 'tekit' && l.id === 'corredor-textil')?.imagen?.src).toBeTruthy()
    expect(new Set(lugaresExplorar.map(l => `${l.destino}:${l.id}`)).size).toBe(lugaresExplorar.length)
  })

  it('expone solo categorías con contenido y combina búsqueda sin acentos con filtros', () => {
    expect(categoriasExplorar.some(c => c.id === 'cenotes')).toBe(true)
    expect(categoriasExplorar.some(c => c.id === 'evento-vacío')).toBe(false)
    expect(buscarLugares('cenote tza', 'homun', 'cenotes').map(l => l.id)).toEqual(['tza-ujun-kat'])
    expect(buscarLugares('ZACI', 'valladolid', 'cenotes')).toHaveLength(1)
    expect(buscarLugares('nada que exista')).toHaveLength(0)
  })

  it.each(['izamal', 'valladolid', 'tekit', 'homun', 'ticul'] as const)('mantiene las rutas de planificación de %s', destino => {
    expect(urlPlanificador(destino, 'recomendado')).toContain(`/rutas/${destino}/itinerario?`)
    expect(urlPlanificador(destino, 'personalizado')).toContain(`/rutas/${destino}/personalizar?`)
  })
})
