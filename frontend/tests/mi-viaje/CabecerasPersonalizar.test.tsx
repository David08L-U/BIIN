import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../src/types/auth'
import { router as routerAplicacion } from '../../src/app/router'

const sesion = vi.hoisted(() => ({ usuario: null as Usuario | null }))
vi.mock('../../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: sesion.usuario, cargando: false, tieneRol: () => false, cerrarSesion: vi.fn() }),
}))

const routers: ReturnType<typeof createMemoryRouter>[] = []
function montar(destino: string) {
  const router = createMemoryRouter(routerAplicacion.routes, {
    initialEntries: [`/rutas/${destino}/personalizar?estancia=medio-dia&fecha=2026-11-30&inicio=11%3A30&minutos=240`],
  })
  routers.push(router)
  return render(<RouterProvider router={router} />)
}

afterEach(() => {
  cleanup()
  routers.splice(0).forEach(router => router.dispose())
  vi.restoreAllMocks()
})
afterAll(() => routerAplicacion.dispose())

describe('Cabeceras de personalización', () => {
  it.each(['izamal', 'valladolid', 'tekit', 'homun', 'ticul'])(
    'retira el acceso de perfil sin acción en %s y conserva las acciones funcionales', destino => {
      const { container } = montar(destino)
      expect(container.querySelector('.iz-plan-avatar')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reiniciar selección' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Perfil' })).toBeInTheDocument()
    },
  )
})
