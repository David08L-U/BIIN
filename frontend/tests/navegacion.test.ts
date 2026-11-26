import { describe, expect, it, vi } from 'vitest'
import { destinoInterno, regresarEnBIIN } from '../src/utils/navegacion'

describe('regreso dentro de BIIN', () => {
  it('vuelve al elemento anterior de la app si existe historial interno', () => {
    const navegar = vi.fn()
    regresarEnBIIN(navegar, '/explorar?q=cenote&destino=homun', '/explorar', 2)
    expect(navegar).toHaveBeenCalledWith(-1)
  })

  it('usa el contexto y filtros como respaldo en una entrada directa', () => {
    const navegar = vi.fn()
    regresarEnBIIN(navegar, '/explorar?q=cenote&destino=homun', '/explorar', 0)
    expect(navegar).toHaveBeenCalledWith('/explorar?q=cenote&destino=homun', { replace: true })
  })

  it('rechaza destinos externos y conserva un respaldo local', () => {
    expect(destinoInterno('https://example.org', '/rutas')).toBe('/rutas')
    expect(destinoInterno('//example.org', '/explorar')).toBe('/explorar')
  })
})
