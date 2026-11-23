import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
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

  it('muestra y cierra la ficha de una parada CU-03', async () => {
    montar()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole('button', {
        name: 'Ver parada Terminal Noreste',
      }),
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Terminal Noreste',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Cerrar detalles',
      }),
    )

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()
  })

  it('identifica el marcador como ilustrativo RNF05', async () => {
    montar()

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Ver origen ilustrativo del prototipo',
      }),
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'No representa tu ubicación GPS.',
    )
  })
})