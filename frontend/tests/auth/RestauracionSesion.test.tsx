import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../src/features/auth/AuthContext'
import RutaProtegida from '../../src/features/auth/RutaProtegida'
import { expiracionJwtEnMs } from '../../src/features/auth/expiracionJwt'
import { useAuth } from '../../src/features/auth/useAuth'

const destino = '/perfil?tab=cuenta#datos'
const expiracionFutura = Math.floor(Date.now() / 1000) + 2 * 60 * 60
const tokenValido = `e30.${btoa(JSON.stringify({ exp: expiracionFutura })).replace(/=/g, '')}.firma`

function Protegido() {
  const { usuario, cerrarSesion } = useAuth()
  return (
    <section>
      <h1>Perfil de {usuario?.nombre}</h1>
      <button onClick={cerrarSesion}>Cerrar sesión</button>
    </section>
  )
}

function renderizar(destinoInicial = destino) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <h1>Acceso</h1> },
      { element: <RutaProtegida />, children: [{ path: '/perfil', element: <Protegido /> }] },
    ],
    { initialEntries: [destinoInicial] },
  )
  render(<AuthProvider><RouterProvider router={router} /></AuthProvider>)
  return router
}

function respuestaUsuario(status = 200) {
  return new Response(JSON.stringify({
    idUsuario: 42,
    nombre: 'Melanie Baas Aguilar',
    correo: 'melanie@example.test',
    roles: ['viajero'],
  }), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('restauración de sesión', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('valida el token guardado con el backend y restaura identidad tras recargar', async () => {
    localStorage.setItem('biin.token', tokenValido)
    vi.mocked(fetch).mockResolvedValue(respuestaUsuario())

    renderizar()

    expect(await screen.findByRole('heading', { name: 'Perfil de Melanie Baas Aguilar' })).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/auth/yo', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: `Bearer ${tokenValido}` }),
    }))
    expect(localStorage.getItem('biin.token')).toBe(tokenValido)
  })

  it('conserva el token ante un fallo temporal y permite reintentar', async () => {
    localStorage.setItem('biin.token', tokenValido)
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(respuestaUsuario())

    renderizar()

    expect(await screen.findByRole('heading', { name: 'Tu sesión no está disponible' })).toBeInTheDocument()
    expect(localStorage.getItem('biin.token')).toBe(tokenValido)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { name: 'Perfil de Melanie Baas Aguilar' })).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('elimina solo el token rechazado y vuelve a login con la ruta completa', async () => {
    localStorage.setItem('biin.token', tokenValido)
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }))
    const router = renderizar()

    expect(await screen.findByRole('heading', { name: 'Acceso' })).toBeInTheDocument()
    expect(localStorage.getItem('biin.token')).toBeNull()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state).toEqual({ desde: destino })
  })

  it('bloquea el contenido protegido después de cerrar sesión', async () => {
    localStorage.setItem('biin.token', tokenValido)
    vi.mocked(fetch).mockResolvedValue(respuestaUsuario())
    const router = renderizar()

    await screen.findByRole('heading', { name: 'Perfil de Melanie Baas Aguilar' })
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('heading', { name: 'Acceso' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Perfil de Melanie Baas Aguilar' })).not.toBeInTheDocument()
    expect(localStorage.getItem('biin.token')).toBeNull()
    expect(router.state.location.state).toEqual({ desde: destino })
  })

  it('lee expiración solo de tokens JWT válidos', () => {
    expect(expiracionJwtEnMs(tokenValido)).toBe(expiracionFutura * 1000)
    expect(expiracionJwtEnMs('token-invalido')).toBeNull()
    expect(expiracionJwtEnMs('e30.e30.firma')).toBeNull()
  })
})
