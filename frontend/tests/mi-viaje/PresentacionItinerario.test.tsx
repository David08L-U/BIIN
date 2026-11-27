import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { router as routerAplicacion } from '../../src/app/router'

vi.mock('../../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: null, cargando: false, tieneRol: () => false, cerrarSesion: vi.fn() }),
}))

const destinos = [
  ['izamal', 'Efectivo en mano'],
  ['valladolid', 'Calzado cómodo'],
  ['tekit', 'Prepara tus compras'],
  ['homun', 'Conservación del agua'],
  ['ticul', 'Empaque para cerámica'],
] as const
const routers: ReturnType<typeof createMemoryRouter>[] = []

afterEach(() => {
  cleanup()
  routers.splice(0).forEach(router => router.dispose())
})
afterAll(() => routerAplicacion.dispose())

describe('Presentación de itinerarios', () => {
  it.each(destinos)('%s conserva sus consejos y no muestra el circuito ilustrativo', (destino, consejo) => {
    const router = createMemoryRouter(routerAplicacion.routes, {
      initialEntries: [`/rutas/${destino}/itinerario?estancia=medio-dia&fecha=2026-11-30&inicio=09%3A00&minutos=540&generado=1`],
    })
    routers.push(router)
    render(<RouterProvider router={router} />)

    expect(screen.getByRole('heading', { name: 'Consejos de viaje BIIN' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: consejo })).toBeInTheDocument()
    expect(screen.queryByText(/Circuito Artesanal Tekit|Circuito Peatonal Valladolid|Circuito Cenotes Homún|Circuito Artesanal Ticul|Esquema ilustrativo/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver detalle de ruta/ })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0)
  })
})
