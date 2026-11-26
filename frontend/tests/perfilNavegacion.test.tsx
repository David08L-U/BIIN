import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import PerfilVista from '../src/features/perfil/components/PerfilVista'

const datos = {
  nombre: 'Ana López',
  correo: 'ana@ejemplo.com',
  periodo: 'noviembre 2026',
  movilidad: [null, null, null] as [null, null, null],
  itinerarios: [],
}

function renderPerfil(entradas: string[]) {
  const router = createMemoryRouter([
    { path: '/rutas', element: <h1>Catálogo de rutas</h1> },
    { path: '/', element: <h1>Inicio de BIIN</h1> },
    { path: '/perfil', element: <PerfilVista datos={datos} /> },
  ], { initialEntries: entradas })
  render(<RouterProvider router={router} />)
  return router
}

describe('regreso desde Perfil', () => {
  it('vuelve a la pantalla anterior de BIIN si existe historial', async () => {
    window.history.replaceState({ idx: 1 }, '', '/')
    renderPerfil(['/rutas', '/perfil'])
    await userEvent.click(screen.getByRole('button', { name: 'Regresar a la pantalla anterior' }))
    expect(await screen.findByRole('heading', { name: 'Catálogo de rutas' })).toBeInTheDocument()
  })

  it('usa Inicio como respaldo para un enlace directo', async () => {
    window.history.replaceState({ idx: 0 }, '', '/')
    renderPerfil(['/perfil'])
    await userEvent.click(screen.getByRole('button', { name: 'Regresar a la pantalla anterior' }))
    expect(await screen.findByRole('heading', { name: 'Inicio de BIIN' })).toBeInTheDocument()
  })
})
