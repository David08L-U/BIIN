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

  it('envía nombre y correo limpios y pide el código sin iniciar sesión', async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaPendiente())

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
      await screen.findByRole('heading', { name: 'Confirma tu correo' }),
    ).toBeInTheDocument()
    expect(screen.getByText('ana@ejemplo.com')).toBeInTheDocument()
    expect(localStorage.getItem('biin.token')).toBeNull()

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

  it('avisa en el campo de correo que llegará un código', () => {
    renderizarRegistro()

    expect(screen.getByLabelText('Correo')).toHaveAccessibleDescription(
      'Te enviaremos un código para confirmarlo.',
    )
  })

  it('confirma el código, guarda la sesión y navega', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(respuestaPendiente())
      .mockResolvedValueOnce(
        respuestaJson(201, {
          token: 'token-de-prueba',
          expiraEn: '2030-01-01T00:00:00Z',
          usuario: {
            idUsuario: 42,
            nombre: 'Ana López',
            correo: 'ana@ejemplo.com',
            roles: ['viajero'],
          },
        }),
      )

    renderizarRegistro()
    const usuario = await completarFormulario()
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await usuario.type(await screen.findByLabelText('Código'), '04 29a17')
    await usuario.click(
      screen.getByRole('button', { name: 'Confirmar y crear cuenta' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Inicio de prueba' }),
    ).toBeInTheDocument()
    expect(localStorage.getItem('biin.token')).toBe('token-de-prueba')
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/auth/registro/verificar',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ correo: 'ana@ejemplo.com', codigo: '042917' }),
      }),
    )
  })

  it('pide los 6 dígitos antes de llamar al servidor', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(respuestaPendiente())

    renderizarRegistro()
    const usuario = await completarFormulario()
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await usuario.type(await screen.findByLabelText('Código'), '123')
    await usuario.click(
      screen.getByRole('button', { name: 'Confirmar y crear cuenta' }),
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Escribe los 6 dígitos del código que te enviamos.',
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('muestra el error de un código incorrecto y deja reintentar', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(respuestaPendiente())
      .mockResolvedValueOnce(
        respuestaJson(400, {
          detail: 'El código no es correcto. Te quedan 4 intentos.',
        }),
      )

    renderizarRegistro()
    const usuario = await completarFormulario()
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await usuario.type(await screen.findByLabelText('Código'), '000000')
    await usuario.click(
      screen.getByRole('button', { name: 'Confirmar y crear cuenta' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Te quedan 4 intentos',
    )
    expect(
      screen.getByRole('button', { name: 'Confirmar y crear cuenta' }),
    ).toBeEnabled()
    expect(localStorage.getItem('biin.token')).toBeNull()
  })

  it('permite volver al formulario con los datos escritos para corregir el correo', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(respuestaPendiente('ana@gmial.com'))
      .mockResolvedValueOnce(respuestaPendiente('ana@gmail.com'))

    renderizarRegistro()
    const usuario = await completarFormulario('Ana López', 'ana@gmial.com')
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await usuario.click(
      await screen.findByRole('button', { name: 'Volver y corregir mis datos' }),
    )

    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana López')
    expect(screen.getByLabelText('Correo')).toHaveValue('ana@gmial.com')
    expect(screen.getByLabelText('Contraseña')).toHaveValue('clave12345')

    await usuario.clear(screen.getByLabelText('Correo'))
    await usuario.type(screen.getByLabelText('Correo'), 'ana@gmail.com')
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('ana@gmail.com')).toBeInTheDocument()
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/auth/registro',
      expect.objectContaining({
        body: JSON.stringify({
          nombre: 'Ana López',
          correo: 'ana@gmail.com',
          contrasena: 'clave12345',
        }),
      }),
    )
  })

  it('bloquea el reenvío durante la espera y lo permite al terminar', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(respuestaPendiente('ana@ejemplo.com', 0))
      .mockResolvedValueOnce(respuestaPendiente('ana@ejemplo.com', 60))

    renderizarRegistro()
    const usuario = await completarFormulario()
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await usuario.click(
      await screen.findByRole('button', { name: 'Reenviar código' }),
    )

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Te enviamos un código nuevo.',
    )
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/auth/registro/reenviar',
      expect.objectContaining({
        body: JSON.stringify({ correo: 'ana@ejemplo.com' }),
      }),
    )
    expect(
      screen.getByRole('button', { name: /Reenviar código \(\d+ s\)/ }),
    ).toBeDisabled()
  })
})

function respuestaJson(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Respuesta 202 del registro; `esperaSegundos` fija cuándo se puede pedir otro código. */
function respuestaPendiente(correo = 'ana@ejemplo.com', esperaSegundos = 60) {
  const ahora = Date.now()
  return respuestaJson(202, {
    correo,
    expiraEn: new Date(ahora + 15 * 60_000).toISOString(),
    reenviarDesde: new Date(ahora + esperaSegundos * 1000).toISOString(),
  })
}
