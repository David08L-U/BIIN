import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
} from 'react-router'
import { describe, expect, it } from 'vitest'

import InicioPage from '../src/features/transporte/pages/InicioPage'

function montar() {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <Outlet context={{ abrirMenu: () => {} }} />
      ),
      children: [
        {
          index: true,
          element: <InicioPage />,
        },
        {
          path: 'rutas',
          element: <p>Catálogo de rutas</p>,
        },
      ],
    },
  ])

  render(<RouterProvider router={router} />)

  return router
}

describe('Inicio basado en el prototipo de Melanie', () => {
  it('combina búsqueda sin acentos y filtro CU-02', async () => {
    montar()
    const user = userEvent.setup()

    await user.type(
      screen.getByRole('textbox', {
        name: 'Buscar rutas o destinos',
      }),
      'homun',
    )

    expect(
      screen.getByRole('link', {
        name: 'Ver ruta a Homún',
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('link', {
        name: 'Ver ruta a Izamal',
      }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'Directos',
      }),
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'No hay rutas para esta búsqueda y filtro.',
    )
  })

  it('conserva la búsqueda al navegar al catálogo CU-02', async () => {
    const router = montar()
    const user = userEvent.setup()

    await user.type(
      screen.getByRole('textbox', {
        name: 'Buscar rutas o destinos',
      }),
      'Izamal',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Buscar destino',
      }),
    )

    expect(router.state.location.pathname).toBe('/rutas')
    expect(router.state.location.search).toBe('?q=Izamal')
  })

  it('abre el mapa geográfico con atribución, desplazamiento y zoom', async () => {
    montar()
    const mapa = document.querySelector('.leaflet-container')
    expect(mapa).toHaveClass('leaflet-grab')
    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright')
    expect(screen.getByText(/Vista general de Mérida/)).toBeInTheDocument()
    expect(screen.queryByText('Estás aquí')).not.toBeInTheDocument()
    const tesela = mapa?.querySelector('img.leaflet-tile')
    expect(tesela).toHaveAttribute('src', expect.stringContaining('https://tile.openstreetmap.org/13/'))
    await userEvent.click(screen.getByRole('button', { name: 'Acercar mapa' }))
    expect(mapa?.querySelector('img[src*="openstreetmap.org/14/"]')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Alejar mapa' }))
    expect(mapa?.querySelector('img[src*="openstreetmap.org/13/"]')).toBeInTheDocument()
  })

  it('anuncia el fallo de las teselas conservando la referencia y el buscador', () => {
    montar()
    const tesela = document.querySelector('.leaflet-tile')!
    fireEvent.error(tesela)
    expect(screen.getByRole('status')).toHaveTextContent('No se pudo cargar parte del mapa')
    expect(screen.getByText(/Vista general de Mérida/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Buscar rutas o destinos' })).toBeInTheDocument()
  })
})
