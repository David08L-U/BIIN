import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
} from 'react-router'

import { describe, expect, it } from 'vitest'

import RutasPage from '../src/features/transporte/pages/RutasPage'
import DetalleRutaPage from '../src/features/transporte/pages/DetalleRutaPage'

function montar(ruta = '/rutas') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <Outlet context={{ abrirMenu: () => {} }} />
        ),
        children: [
          {
            path: 'rutas',
            element: <RutasPage />,
          },
          {
            path: 'rutas/:id',
            element: <DetalleRutaPage />,
          },
        ],
      },
    ],
    {
      initialEntries: [ruta],
    },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('Catálogo de rutas de Melanie CU-02', () => {
  it('muestra los cinco destinos de referencia', () => {
    montar()

    expect(
      screen.getAllByRole('link', {
        name: /^Ver ruta a /,
      }),
    ).toHaveLength(5)
  })

  it('recibe una búsqueda desde inicio e ignora acentos', () => {
    montar('/rutas?q=HOMUN')

    expect(
      screen.getByRole('link', {
        name: 'Ver ruta a Homún',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getAllByRole('link', {
        name: /^Ver ruta a /,
      }),
    ).toHaveLength(1)
  })

  it('recibe la selección de una tarjeta de inicio', () => {
    montar('/rutas?destino=izamal')

    expect(
      screen.getByRole('searchbox', {
        name: 'Buscar rutas o destinos',
      }),
    ).toHaveValue('Izamal')

    expect(
      screen.getAllByRole('link', {
        name: /^Ver ruta a /,
      }),
    ).toHaveLength(1)
  })

  it('combina texto y filtro y permite restablecerlos', async () => {
    montar('/rutas?q=homun')
    const user = userEvent.setup()

    await user.click(
      screen.getByRole('button', {
        name: 'Directos',
      }),
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'No encontramos rutas',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Restablecer búsqueda',
      }),
    )

    expect(
      screen.getAllByRole('link', {
        name: /^Ver ruta a /,
      }),
    ).toHaveLength(5)
  })

  it('muestra Valladolid y Homún al filtrar cenotes', async () => {
    montar()

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Ruta Cenotes',
      }),
    )

    expect(
      screen.getByRole('link', {
        name: 'Ver ruta a Valladolid',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: 'Ver ruta a Homún',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getAllByRole('link', {
        name: /^Ver ruta a /,
      }),
    ).toHaveLength(2)
  })

  it('limpia la selección conservando el filtro elegido', async () => {
    const router = montar(
      '/rutas?destino=izamal&tipo=directos',
    )

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Limpiar búsqueda',
      }),
    )

    expect(
      screen.getByRole('searchbox', {
        name: 'Buscar rutas o destinos',
      }),
    ).toHaveValue('')

    expect(
      screen.getAllByRole('link', {
        name: /^Ver ruta a /,
      }),
    ).toHaveLength(4)

    expect(router.state.location.search).toBe(
      '?tipo=directos',
    )
  })

  it('abre el detalle del destino seleccionado', async () => {
    const router = montar()

    await userEvent.click(
      screen.getByRole('link', {
        name: 'Ver ruta a Izamal',
      }),
    )

    expect(router.state.location.pathname).toBe(
      '/rutas/izamal',
    )
    expect(
      screen.getByRole('heading', { name: 'Izamal', level: 1 }),
    ).toBeInTheDocument()
  })
})
