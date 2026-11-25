import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../src/features/auth/AuthContext'
import RegistroPage from '../../src/features/auth/pages/RegistroPage'

function renderizarRegistro() {
  const router = createMemoryRouter(
    [
      {
        path: '/registro',
        element: <RegistroPage />,
      },
      {
        path: '/',
        element: <h1>Inicio de prueba</h1>,
      },
    ],
    {
      initialEntries: ['/registro'],
    },
  )

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

async function completarFormulario(
  nombre = 'Ana López',
  correo = 'ana@ejemplo.com',
  contrasena = 'clave12345',
) {
  const usuario = userEvent.setup()

  if (nombre) {
    await usuario.type(screen.getByLabelText('Nombre'), nombre)
  }

  if (correo) {
    await usuario.type(screen.getByLabelText('Correo'), correo)
  }

  if (contrasena) {
    await usuario.type(screen.getByLabelText('Contraseña'), contrasena)
  }

  return usuario
}

describe('RegistroPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('muestra los campos y la ayuda de la contraseña', () => {
    renderizarRegistro()

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription(
      'Mínimo 8 caracteres.',
    )
  })

  it.each(['', '   '])(
    'rechaza un nombre vacío o solo con espacios (%j)',
    async nombre => {
      renderizarRegistro()
      const usuario = await completarFormulario(nombre)

      await usuario.click(
        screen.getByRole('button', { name: 'Crear cuenta' }),
      )

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Escribe tu nombre.',
      )
      expect(screen.getByLabelText('Nombre')).toHaveFocus()
      expect(fetch).not.toHaveBeenCalled()
    },
  )

  it('pide el correo cuando está vacío', async () => {
    renderizarRegistro()
    const usuario = await completarFormulario('Ana López', '')

    await usuario.click(
      screen.getByRole('button', { name: 'Crear cuenta' }),
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Escribe tu correo electrónico.',
    )
    expect(screen.getByLabelText('Correo')).toHaveFocus()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rechaza un correo inválido antes de enviar', async () => {
    renderizarRegistro()
    const usuario = await completarFormulario(
      'Ana López',
      'correo-invalido',
    )

    await usuario.click(
      screen.getByRole('button', { name: 'Crear cuenta' }),
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Escribe un correo electrónico válido.',
    )
    expect(screen.getByLabelText('Correo')).toHaveFocus()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('pide una contraseña cuando está vacía', async () => {
    renderizarRegistro()
    const usuario = await completarFormulario(
      'Ana López',
      'ana@ejemplo.com',
      '',
    )

    await usuario.click(
      screen.getByRole('button', { name: 'Crear cuenta' }),
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Escribe una contraseña.',
    )
    expect(screen.getByLabelText('Contraseña')).toHaveFocus()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rechaza una contraseña de menos de ocho caracteres', async () => {
    renderizarRegistro()
    const usuario = await completarFormulario(
      'Ana López',
      'ana@ejemplo.com',
      '1234567',
    )

    await usuario.click(
      screen.getByRole('button', { name: 'Crear cuenta' }),
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'La contraseña debe tener al menos 8 caracteres.',
    )
    expect(screen.getByLabelText('Contraseña')).toHaveFocus()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('muestra el rechazo del servidor y permite corregir el formulario', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: 'Este correo ya está registrado.',
        }),
        {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    renderizarRegistro()
    const usuario = await completarFormulario()

    await usuario.click(
      screen.getByRole('button', { name: 'Crear cuenta' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este correo ya está registrado.',
    )
    expect(screen.getByLabelText('Correo')).toHaveValue(
      'ana@ejemplo.com',
    )
    expect(
      screen.getByRole('button', { name: 'Crear cuenta' }),
    ).toBeEnabled()
  })

  it('envía nombre y correo limpios y navega tras una respuesta exitosa', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
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
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    renderizarRegistro()
    const usuario = await completarFormulario(
      '  Ana López  ',
      '  ana@ejemplo.com  ',
      ' clave de prueba ',
    )

    await usuario.click(
      screen.getByRole('button', { name: 'Crear cuenta' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Inicio de prueba' }),
    ).toBeInTheDocument()

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/registro',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          nombre: 'Ana López',
          correo: 'ana@ejemplo.com',
          contrasena: ' clave de prueba ',
        }),
      }),
    )
  })
})