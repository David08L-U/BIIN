import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import LogoBiin from '../../src/components/ui/LogoBiin'
import Layout from '../../src/components/layout/Layout'

vi.mock('../../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: null, cargando: false, cerrarSesion: vi.fn(), tieneRol: () => false }),
}))

describe('LogoBiin', () => {
  it('usa el recurso recortado con alt BIIN en tamaños de acceso y cabecera', () => {
    const { container } = render(<><LogoBiin tamaño="acceso" /><LogoBiin tamaño="compacto" /></>)
    const logos = screen.getAllByRole('img', { name: 'BIIN' })
    expect(logos).toHaveLength(2)
    expect(logos[0]).toHaveClass('logo-biin--acceso')
    expect(logos[1]).toHaveClass('logo-biin--compacto')
    expect(logos[0]).toHaveAttribute('src', expect.stringContaining('biin-logo'))
    expect(container.querySelectorAll('img[alt="BIIN"]')).toHaveLength(2)
  })

  it('mantiene el enlace de marca y la imagen en el menú BIIN', async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function (this: HTMLDialogElement) { this.setAttribute('open', '') },
    })
    const router = createMemoryRouter([{
      element: <Layout />,
      children: [
        { path: '/explorar', element: <p>Lugares</p> },
        { path: '/', element: <h1>Inicio</h1> },
      ],
    }], { initialEntries: ['/explorar'] })
    render(<RouterProvider router={router} />)
    expect(screen.getByRole('link', { name: 'BIIN' })).toHaveAttribute('href', '/')
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(screen.getAllByRole('img', { name: 'BIIN' })).toHaveLength(2)
  })
})
