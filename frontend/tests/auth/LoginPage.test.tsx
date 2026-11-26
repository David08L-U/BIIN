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

    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('muestra el título BIIN y permite mostrar/ocultar la contraseña', async () => {
    renderizarLogin()
    expect(screen.getByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument()
    const usuario = userEvent.setup()
    const entrada = screen.getByLabelText('Contraseña')
    expect(entrada).toHaveAttribute('type', 'password')
    await usuario.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')
    await usuario.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
  })

  it('muestra estados pendientes de Google y recuperación sin contactar servicios', async () => {
    const solicitar = vi.fn()
    vi.stubGlobal('fetch', solicitar)
    renderizarLogin()
    const usuario = userEvent.setup()
    await usuario.click(screen.getByRole('button', { name: /Google/ }))
    expect(screen.getByRole('status')).toHaveTextContent('pendiente de integración')
    await usuario.click(screen.getByRole('button', { name: /Olvidaste tu contraseña/ }))
    expect(screen.getByRole('status')).toHaveTextContent('recuperación de contraseña')
    expect(screen.queryByRole('button', { name: /Apple/ })).not.toBeInTheDocument()
    expect(solicitar).not.toHaveBeenCalled()
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
    expect(screen.getByLabelText('Correo electrónico')).toHaveFocus()
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute(
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
      screen.getByLabelText('Correo electrónico'),
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
    expect(screen.getByLabelText('Correo electrónico')).toHaveFocus()
    expect(solicitar).not.toHaveBeenCalled()
  })

  it('pide la contraseña sin enviar una petición', async () => {
    const solicitar = vi.fn()
    vi.stubGlobal('fetch', solicitar)

    const usuario = userEvent.setup()
    renderizarLogin()

    await usuario.type(
      screen.getByLabelText('Correo electrónico'),
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
      screen.getByLabelText('Correo electrónico'),
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
      screen.getByLabelText('Correo electrónico'),
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
