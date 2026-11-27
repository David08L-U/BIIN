import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { router as configurado } from '../../src/app/router'
import { AuthContext } from '../../src/features/auth/authContextValor'
import { contexto, pagina, recorrido, resumenRecorrido, ruta, simularApi } from './fixtures'

vi.mock('../../src/maps/MapaRecorrido', () => ({ default: () => <div>Mapa de prueba</div> }))
vi.mock('../../src/features/transporte/components/MapaInicio', () => ({ default: () => <div>Mapa de Inicio</div> }))
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })

describe('rutas reales de la aplicación', () => {
  it.each([
    ['/rutas/901/itinerario?recorrido=551', 'Tu itinerario recomendado'],
    ['/rutas/901/personalizar?recorrido=551', 'Personalizar itinerario'],
    ['/recorridos/551/itinerario', 'Tu itinerario recomendado'],
    ['/recorridos/551/personalizar', 'Personalizar itinerario'],
  ])('monta el planificador compartido en %s', async (url, titulo) => {
    simularApi(u => u.pathname === '/api/rutas/901' ? ruta() : u.pathname === '/api/recorridos/551' ? recorrido() : pagina([resumenRecorrido()]))
    const router = createMemoryRouter(configurado.routes, { initialEntries: [url] })
    render(<AuthContext.Provider value={contexto()}><RouterProvider router={router} /></AuthContext.Provider>)
    expect(await screen.findByRole('heading', { name: titulo })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
  })
  it('protege el detalle de itinerarios y conserva retorno a la cuenta', async () => {
    const fetch = simularApi(() => [])
    const router = createMemoryRouter(configurado.routes, { initialEntries: ['/mi-viaje/345'] })
    render(<AuthContext.Provider value={contexto(null)}><RouterProvider router={router} /></AuthContext.Provider>)
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument()
    expect(router.state.location.state.desde).toBe('/mi-viaje/345')
    expect(fetch).not.toHaveBeenCalled()
  })
})
