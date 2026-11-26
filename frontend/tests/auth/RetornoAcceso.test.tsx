import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../src/features/auth/AuthContext'
import RutaProtegida from '../../src/features/auth/RutaProtegida'
import LoginPage from '../../src/features/auth/pages/LoginPage'
import RegistroPage from '../../src/features/auth/pages/RegistroPage'

const destino = '/mi-viaje?origen=itinerario#guardados'

function renderizarFlujo() {
  const router = createMemoryRouter(
    [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/registro',
        element: <RegistroPage />,
      },
      {
        element: <RutaProtegida />,
        children: [
          {
            path: '/mi-viaje',
            element: <h1>Mi viaje de prueba</h1>,
          },
        ],
      },
    ],
    {
      initialEntries: [destino],
    },
  )

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )

  return router
}

function respuestaExitosa(estado: number) {
  return new Response(
    JSON.stringify({
      token: 'token-de-prueba',
      expiraEn: '2030-01-01T00:00:00Z',
      usuario: {
        idUsuario: 42,
        nombre: 'Ana López',
        correo: 'ana@ejemplo.com',
        roles: ['viajero'],
      },
    }),
    {
      status: estado,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
}

describe('Retorno tras el acceso CU-01 / CU-09', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('regresa al enlace completo después de pasar de acceso a registro', async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaExitosa(201))

    const usuario = userEvent.setup()
    const router = renderizarFlujo()

    await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })

    await usuario.click(
      screen.getByRole('link', { name: 'Crear cuenta' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Crear cuenta' }),
    ).toBeInTheDocument()

    await usuario.type(screen.getByLabelText('Nombre'), 'Ana')
    await usuario.type(screen.getByLabelText('Apellido'), 'López')
    await usuario.type(
      screen.getByLabelText('Correo electrónico'),
      'ana@ejemplo.com',
    )
    await usuario.type(
      screen.getByLabelText('Contraseña'),
      'clave12345',
    )
    await usuario.click(
      screen.getByRole('button', { name: 'Crear cuenta' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Mi viaje de prueba' }),
    ).toBeInTheDocument()

    const ubicacion = router.state.location

    expect(
      ubicacion.pathname + ubicacion.search + ubicacion.hash,
    ).toBe(destino)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('conserva el destino al ir a registro y volver al inicio de sesión', async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaExitosa(200))

    const usuario = userEvent.setup()
    const router = renderizarFlujo()

    await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })

    await usuario.click(
      screen.getByRole('link', { name: 'Crear cuenta' }),
    )
    await usuario.click(
      screen.getByRole('link', { name: 'Inicia sesión' }),
    )

    await usuario.type(
      screen.getByLabelText('Correo electrónico'),
      'ana@ejemplo.com',
    )
    await usuario.type(
      screen.getByLabelText('Contraseña'),
      'clave12345',
    )
    await usuario.click(
      screen.getByRole('button', { name: 'Entrar' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Mi viaje de prueba' }),
    ).toBeInTheDocument()

    const ubicacion = router.state.location

    expect(
      ubicacion.pathname + ubicacion.search + ubicacion.hash,
    ).toBe(destino)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
