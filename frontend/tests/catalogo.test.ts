import { describe, expect, it } from 'vitest'
import { destinosDemo } from '../src/features/transporte/demo/destinos'
import { filtrarDestinos } from '../src/features/transporte/filtrarDestinos'
import { actividadesDemo } from '../src/features/exploracion/demo/actividades'

describe('CU-02 Búsqueda de rutas', () => {
  it('encuentra nombres con o sin acentos', () => {
    expect(
      filtrarDestinos(destinosDemo, '  HOMUN ', 'todas').map((d) => d.id),
    ).toEqual(['homun'])
  })
  it('combina el filtro de cenotes con el texto', () => {
    expect(
      filtrarDestinos(destinosDemo, 'valladolid', 'cenotes').map((d) => d.id),
    ).toEqual(['valladolid'])
    expect(filtrarDestinos(destinosDemo, 'tekit', 'cenotes')).toEqual([])
  })
  it('solo muestra destinos directos cuando se solicita', () => {
    expect(
      filtrarDestinos(destinosDemo, '', 'directos').every((d) => d.directo),
    ).toBe(true)
    expect(filtrarDestinos(destinosDemo, '', 'directos')).toHaveLength(3)
  })
  it('no inventa rutas cuando el origen carece de cobertura', () => {
    expect(filtrarDestinos(destinosDemo, '', 'todas', 'otro')).toEqual([])
  })
  it('devuelve vacío para una localidad sin coincidencias', () => {
    expect(filtrarDestinos(destinosDemo, 'Cancún', 'todas')).toEqual([])
  })
})

describe('CU-03/07 Integridad del catálogo demostrativo', () => {
  it('cada ruta comienza en Mérida y termina en su destino', () => {
    for (const d of destinosDemo) {
      expect(d.paradas[0].nombre).toContain('Mérida')
      expect(d.paradas.at(-1)?.coordenadas).toEqual(d.coordenadas)
    }
  })
  it('las actividades solo hacen referencia a destinos existentes', () => {
    const ids = new Set(destinosDemo.map((d) => d.id))
    expect(actividadesDemo.every((a) => ids.has(a.destinoId))).toBe(true)
    expect(new Set(actividadesDemo.map((a) => a.id)).size).toBe(
      actividadesDemo.length,
    )
  })
})
