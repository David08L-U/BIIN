import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../src/features/auth/AuthContext'
import LoginPage from '../../src/features/auth/pages/LoginPage'

function renderizarLogin() {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <LoginPage />,
    },
  ])

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

function respuestaNoAutorizada() {
  return new Response(
    JSON.stringify({
      title: 'No autenticado',
      detail: 'Correo o contraseña incorrectos.',
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra campos con etiqueta para correo y contraseña', () => {
    renderizarLogin()

    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('pide el correo y evita enviar el formulario vacío', async () => {
    const solicitar = vi.fn()
    vi.stubGlobal('fetch', solicitar)

    const usuario = userEvent.setup()
    renderizarLogin()

    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Escribe tu correo electrónico.',
    )
    expect(screen.getByLabelText('Correo')).toHaveFocus()
    expect(screen.getByLabelText('Correo')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(solicitar).not.toHaveBeenCalled()
  })

  it('rechaza un correo inválido antes de contactar al servidor', async () => {
    const solicitar = vi.fn()
    vi.stubGlobal('fetch', solicitar)

    const usuario = userEvent.setup()
    renderizarLogin()

    await usuario.type(
      screen.getByLabelText('Correo'),
      'correo-invalido',
    )
    await usuario.type(
      screen.getByLabelText('Contraseña'),
      'claveDePrueba',
    )
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Escribe un correo electrónico válido.',
    )
    expect(screen.getByLabelText('Correo')).toHaveFocus()
    expect(solicitar).not.toHaveBeenCalled()
  })

  it('pide la contraseña sin enviar una petición', async () => {
    const solicitar = vi.fn()
    vi.stubGlobal('fetch', solicitar)

    const usuario = userEvent.setup()
    renderizarLogin()

    await usuario.type(
      screen.getByLabelText('Correo'),
      'ana@ejemplo.com',
    )
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Escribe tu contraseña.',
    )
    expect(screen.getByLabelText('Contraseña')).toHaveFocus()
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(solicitar).not.toHaveBeenCalled()
  })

  it('muestra el mensaje cuando las credenciales son incorrectas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respuestaNoAutorizada()),
    )

    const usuario = userEvent.setup()
    renderizarLogin()

    await usuario.type(
      screen.getByLabelText('Correo'),
      'ana@ejemplo.com',
    )
    await usuario.type(
      screen.getByLabelText('Contraseña'),
      'incorrecta',
    )
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Correo o contraseña incorrectos.',
    )
  })

  it('envía el correo limpio y conserva los espacios de la contraseña', async () => {
    const solicitar = vi.fn().mockResolvedValue(
      respuestaNoAutorizada(),
    )
    vi.stubGlobal('fetch', solicitar)

    const usuario = userEvent.setup()
    renderizarLogin()

    await usuario.type(
      screen.getByLabelText('Correo'),
      '  ana@ejemplo.com  ',
    )
    await usuario.type(
      screen.getByLabelText('Contraseña'),
      ' clave de prueba ',
    )
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    await screen.findByRole('alert')

    expect(solicitar).toHaveBeenCalledTimes(1)
    expect(solicitar).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          correo: 'ana@ejemplo.com',
          contrasena: ' clave de prueba ',
        }),
      }),
    )
  })
})