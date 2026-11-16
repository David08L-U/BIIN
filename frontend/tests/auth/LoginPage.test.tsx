import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../src/features/auth/AuthContext'
import LoginPage from '../../src/features/auth/pages/LoginPage'

function renderizarLogin() {
  const router = createMemoryRouter([{ path: '/', element: <LoginPage /> }])
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('muestra campos con etiqueta para correo y contraseña', () => {
    renderizarLogin()

    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('muestra el mensaje del backend cuando las credenciales son incorrectas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ title: 'No autenticado', detail: 'Correo o contraseña incorrectos.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    ))
    renderizarLogin()

    await userEvent.type(screen.getByLabelText('Correo'), 'ana@ejemplo.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'incorrecta')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
  })
})
