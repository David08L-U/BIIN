import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import RutasPage from '../src/features/transporte/pages/RutasPage'
import PersonalizarPage from '../src/features/mi-viaje/pages/PersonalizarPage'
import ItinerarioPage from '../src/features/mi-viaje/pages/ItinerarioPage'

function montar(ruta: string) {
  const router = createMemoryRouter(
    [
      { path: '/rutas', element: <RutasPage /> },
      { path: '/personalizar/:id', element: <PersonalizarPage /> },
      { path: '/itinerario/:id', element: <ItinerarioPage /> },
    ],
    { initialEntries: [ruta] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('Flujos del frontend', () => {
  afterEach(() => localStorage.clear())
  it('aplica búsqueda y muestra el estado vacío con filtros incompatibles CU-02', async () => {
    montar('/rutas')
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: 'Buscar rutas o destinos' }),
      'tekit',
    )
    expect(
      screen.getByRole('link', { name: 'Ver ruta a Tekit' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Ver ruta a Izamal' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ruta Cenotes' }))
    expect(screen.getByText('No encontramos rutas')).toBeInTheDocument()
  })
  it('impide generar sin seleccionar lugares CU-09', async () => {
    const router = montar('/personalizar/izamal')
    await userEvent.click(
      screen.getByRole('button', { name: 'Generar y guardar mi itinerario' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Selecciona al menos una actividad',
    )
    expect(router.state.location.pathname).toBe('/personalizar/izamal')
    expect(localStorage.getItem('biin.planes.v1')).toBeNull()
  })
  it('guarda la selección y muestra el itinerario con sus horarios CU-09', async () => {
    const router = montar('/personalizar/izamal'),
      user = userEvent.setup()
    await user.click(
      screen.getByRole('checkbox', {
        name: /Convento de San Antonio de Padua/,
      }),
    )
    await user.click(
      screen.getByRole('checkbox', { name: /Restaurante Kinich/ }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Generar y guardar mi itinerario' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Tu itinerario en Izamal' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/itinerario/izamal')
    expect(screen.getByText('11:30 — 12:30')).toBeInTheDocument()
    expect(screen.getByText('12:35 — 13:35')).toBeInTheDocument()
    const planes = JSON.parse(localStorage.getItem('biin.planes.v1')!)
    expect(planes[0].actividades).toEqual(['izamal-convento', 'izamal-kinich'])
  })
  it('no cruza las actividades de Homún con Izamal CU-07', () => {
    montar('/personalizar/homun')
    expect(
      screen.getByRole('checkbox', { name: /Cenote Santa Rosa/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: /Restaurante Kinich/ }),
    ).not.toBeInTheDocument()
  })
  it('reconoce que un borrador no existe en otro dispositivo CU-09', () => {
    montar('/itinerario/izamal?plan=no-existe')
    expect(
      screen.getByText('Este borrador no está en tu dispositivo'),
    ).toBeInTheDocument()
  })
})
