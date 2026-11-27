import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
const visita = 'estancia=medio-dia&fecha=2099-11-30&inicio=09%3A00&minutos=540'

function montar(url: string) {
  const router = createMemoryRouter(routerAplicacion.routes, { initialEntries: [url] })
  routers.push(router)
  render(<RouterProvider router={router} />)
  return router
}

afterEach(() => {
  cleanup()
  routers.splice(0).forEach(router => router.dispose())
})
afterAll(() => routerAplicacion.dispose())

describe('Presentación de itinerarios', () => {
  it.each(destinos)('%s conserva sus consejos y no muestra el circuito ilustrativo', (destino, consejo) => {
    montar(`/rutas/${destino}/itinerario?${visita}&generado=1`)

    expect(screen.getByRole('heading', { name: 'Consejos de viaje BIIN' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: consejo })).toBeInTheDocument()
    expect(screen.queryByText(/Circuito Artesanal Tekit|Circuito Peatonal Valladolid|Circuito Cenotes Homún|Circuito Artesanal Ticul|Esquema ilustrativo/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver detalle de ruta/ })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0)
  })

  it.each(['', '/itinerario', '/personalizar'])('muestra ruta no encontrada para un destino desconocido %s', pantalla => {
    montar(`/rutas/constructor${pantalla}?${visita}&generado=1`)
    expect(screen.getByRole('heading', { name: 'Ruta no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al catálogo de rutas' })).toHaveAttribute('href', '/rutas')
  })

  it('aísla filtros, selección y resultados al cambiar el slug y volver atrás', async () => {
    const usuario = userEvent.setup()
    const router = montar(`/rutas/tekit/itinerario?${visita}&generado=1`)
    await usuario.click(screen.getByRole('button', { name: 'Gastronomía' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(1)
    await act(() => router.navigate(`/rutas/homun/itinerario?${visita}&generado=1`))
    expect(screen.getByRole('button', { name: 'Ruta Sugerida' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Cenote Santa Rosa' })).toBeInTheDocument()
    await act(() => router.navigate(-1))
    expect(screen.getByRole('heading', { name: 'Tu Itinerario en Tekit' })).toBeInTheDocument()
    await usuario.click(screen.getByRole('link', { name: 'Personalizar' }))
    const textil = screen.getByRole('checkbox', { name: 'Corredor Textil y Tiendas de Fabricantes' })
    expect(textil).toBeChecked()
    textil.focus()
    await usuario.keyboard(' ')
    expect(textil).not.toBeChecked()
    await act(() => router.navigate(`/rutas/homun/personalizar?${visita}`))
    expect(screen.getByRole('checkbox', { name: 'Cenote Santa Rosa' })).not.toBeChecked()
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    await act(() => router.navigate(-1))
    expect(screen.getByRole('checkbox', { name: 'Corredor Textil y Tiendas de Fabricantes' })).not.toBeChecked()
  })

  it('abre una vista de fecha pasada, permite descargar y exige fecha válida para regenerar', async () => {
    montar('/rutas/valladolid/itinerario?estancia=medio-dia&fecha=2020-11-30&inicio=09%3A00&minutos=540&generado=1')
    expect(screen.getByText(/Vista de un itinerario con fecha pasada/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar plan' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    await userEvent.click(screen.getByRole('link', { name: 'Personalizar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getAllByRole('alert').map(alerta => alerta.textContent).join(' ')).toContain('la fecha ya pasó')
  })
})
