import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { router as aplicacion } from '../../src/app/router'

vi.mock('../../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: null, cargando: false, tieneRol: () => false }),
}))
afterAll(() => aplicacion.dispose())

describe.each(['itinerario', 'personalizar'])('configuración compartida en %s', vista => {
  it.each([
    ['izamal', 'tarde-magica', 1],
    ['valladolid', 'fin-de-semana', 2],
    ['tekit', 'ruta-textil', 1],
    ['homun', 'fin-de-semana', 2],
    ['ticul', 'tour-compras', 1],
  ] as const)('carga %s y conserva %i jornadas según la modalidad', (destino, estancia, dias) => {
    const router = createMemoryRouter(aplicacion.routes, {
      initialEntries: [`/rutas/${destino}/${vista}?estancia=${estancia}&fecha=2026-12-01&inicio=09:00&minutos=270&minutos2=315&generado=1`],
    })
    const { unmount } = render(<RouterProvider router={router} />)
    try {
      const config = within(screen.getByRole('group', { name: 'Configura tu visita' }))
      expect(config.getByRole('combobox')).toHaveValue(estancia)
      expect(config.getByLabelText('Fecha de visita')).toHaveValue('2026-12-01')
      const jornadas = config.getAllByRole('group', { name: /^Día \d/ })
      expect(jornadas).toHaveLength(dias)
      expect(within(jornadas[0]).getByLabelText(/^Hora de inicio/)).toHaveValue('09:00')
      expect(within(jornadas[0]).getByRole('spinbutton', { name: /^Horas/ })).toHaveValue(4)
      const minutos = within(jornadas[0]).getByRole('spinbutton', { name: /^Minutos/ })
      expect(minutos).toHaveValue(30)
      if (dias === 2) expect(within(jornadas[1]).getByLabelText(/^Fecha del Día 2/)).toHaveValue('2026-12-02')
      fireEvent.change(minutos, { target: { value: '45' } })
      const url = new URLSearchParams(router.state.location.search)
      expect(url.get('minutos')).toBe('285')
      expect(url.has('generado')).toBe(false)
      if (dias === 2) expect(url.get('minutos2')).toBe('315')
    } finally {
      unmount()
      router.dispose()
    }
  })
})
