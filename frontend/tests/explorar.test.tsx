import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import ExplorarPage, { ExplorarDetallePage } from '../src/features/explorar/pages/ExplorarPage'
import ElegirItinerarioPage from '../src/features/explorar/pages/ElegirItinerarioPage'
import { buscarLugares, lugaresExplorar } from '../src/features/explorar/data/lugaresExplorar'
import InicioPage from '../src/features/transporte/pages/InicioPage'

describe('Explorar', () => {
  it('usa datos propios con identificadores compuestos para los cinco destinos', () => {
    expect(new Set(lugaresExplorar.map(l => l.destino))).toEqual(new Set(['izamal', 'valladolid', 'tekit', 'homun', 'ticul']))
    expect(lugaresExplorar.some(l => l.destino === 'izamal' && l.nombre === 'Convento San Antonio de Padua')).toBe(true)
    expect(lugaresExplorar.some(l => l.destino === 'homun' && l.imagen)).toBe(true)
  })

  it('busca sin acentos/mayúsculas y combina destino y categoría', () => {
    expect(buscarLugares('cenote tza', 'homun', 'cenotes').map(l => l.id)).toEqual(['tza-ujun-kat'])
    expect(buscarLugares('ZACI', 'valladolid', 'cenotes')).toHaveLength(1)
    expect(buscarLugares('nada que exista')).toHaveLength(0)
  })

  it('filtra, limpia y comunica estado vacío', () => {
    const router = createMemoryRouter([{ path: '/explorar', element: <ExplorarPage /> }], { initialEntries: ['/explorar'] })
    render(<RouterProvider router={router} />)
    fireEvent.change(screen.getByLabelText('Destino'), { target: { value: 'tekit' } })
    fireEvent.change(screen.getByLabelText('Buscar lugares'), { target: { value: 'sin coincidencia' } })
    expect(screen.getByText(/No encontramos lugares/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByRole('heading', { name: 'Corredor Textil y Tiendas de Fabricantes' })).toBeInTheDocument()
  })

  it('abre un lugar y conserva filtros al volver; el planear enlaza al destino', () => {
    const router = createMemoryRouter([
      { path: '/explorar', element: <ExplorarPage /> },
      { path: '/explorar/lugares/:destino/:id', element: <ExplorarDetallePage /> },
      { path: '/rutas/:destino/itinerario', element: <p>Detalle de ruta</p> },
    ], { initialEntries: ['/explorar?destino=homun&categoria=cenotes'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('link', { name: /Ver detalle de Cenote Santa Rosa/ }))
    expect(screen.getByRole('heading', { name: 'Cenote Santa Rosa' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Planear visita en Homún' }))
    expect(router.state.location.pathname).toBe('/rutas/homun/itinerario')
  })

  it('vuelve del detalle a la búsqueda anterior', () => {
    const router = createMemoryRouter([
      { path: '/explorar', element: <ExplorarPage /> },
      { path: '/explorar/lugares/:destino/:id', element: <ExplorarDetallePage /> },
    ], { initialEntries: ['/explorar?q=mercado&destino=ticul'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('link', { name: /Ver detalle de Poc Chuc Ticule/ }))
    fireEvent.click(screen.getByRole('button', { name: '← Volver a resultados' }))
    expect(router.state.location.pathname + router.state.location.search).toBe('/explorar?q=mercado&destino=ticul')
  })
})

describe('Acceso al planificador desde Inicio', () => {
  it('Itinerario abre selector con recomendado y personalizado por destino', () => {
    const router = createMemoryRouter([
      { element: <Outlet context={{ abrirMenu: () => {} }} />, children: [
        { path: '/', element: <InicioPage /> },
        { path: '/recorridos', element: <ElegirItinerarioPage /> },
        { path: '/rutas/:destino/:modo', element: <p>Planificador</p> },
      ] },
    ], { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('link', { name: /Itinerario/ }))
    expect(screen.getByRole('heading', { name: 'Elige tu destino' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Itinerario recomendado' })[0]).toHaveAttribute('href', expect.stringContaining('/rutas/izamal/itinerario'))
    expect(screen.getAllByRole('link', { name: 'Personalizar itinerario', exact: false })).toHaveLength(5)
  })
})
