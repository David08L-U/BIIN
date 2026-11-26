import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../src/types/auth'
import { ExplorarDetallePage } from '../src/features/explorar/pages/ExplorarPage'
import { crearBorradorValladolid } from '../src/features/mi-viaje/plan/borradorValladolid'
import { guardarItinerarioLocal } from '../src/features/mi-viaje/storage/itinerariosLocales'

const sesion = vi.hoisted(() => ({ usuario: null as Usuario | null }))
vi.mock('../src/features/auth/useAuth', () => ({ useAuth: () => ({ usuario: sesion.usuario, cargando: false, tieneRol: () => false, cerrarSesion: vi.fn() }) }))

beforeEach(() => { localStorage.clear(); sesion.usuario = { idUsuario: 7, nombre: 'Melanie', correo: 'melanie@example.test', roles: ['viajero'] } })

describe('Agregar lugar desde Explorar', () => {
  it('elige un guardado del mismo destino, asigna jornada y abre edición sin modificar el original', () => {
    const borrador = crearBorradorValladolid('fin-de-semana', 'personalizado')
    borrador.configuracion.fecha = '2026-12-02'
    borrador.seleccion = [{ lugarId: 'mercado-donato', dia: 1 }, { lugarId: 'calzada-frailes', dia: 2 }]
    borrador.generado = true
    const resultadoGuardado = guardarItinerarioLocal(7, borrador)
    expect(resultadoGuardado.error).toBeNull()
    const guardado = resultadoGuardado.guardado!
    const router = createMemoryRouter([
      { path: '/explorar/lugares/:destino/:id', element: <ExplorarDetallePage /> },
      { path: '/rutas/valladolid/personalizar', element: <p>Edición abierta</p> },
    ], { initialEntries: ['/explorar/lugares/valladolid/zaci'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a itinerario' }))
    expect(screen.getByRole('heading', { name: 'Agregar Cenote Zací y Parque Principal' })).toBeInTheDocument()
    expect(screen.getByText('2026-12-02 · Fecha futura')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Jornada'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Abrir este itinerario para editar' }))
    expect(router.state.location.pathname).toBe('/rutas/valladolid/personalizar')
    const params = new URLSearchParams(router.state.location.search)
    expect(params.get('editar')).toBe(guardado.id)
    expect(params.get('dia1')).toBe('mercado-donato')
    expect(params.get('dia2')).toBe('calzada-frailes,zaci')
    expect(guardado.borrador.seleccion).toEqual([{ lugarId: 'mercado-donato', dia: 1 }, { lugarId: 'calzada-frailes', dia: 2 }])
  })

  it('no mezcla opciones de otro destino y conserva la intención si solicita acceso', () => {
    sesion.usuario = null
    const router = createMemoryRouter([
      { path: '/explorar/lugares/:destino/:id', element: <ExplorarDetallePage /> },
      { path: '/login', element: <p>Acceso</p> },
    ], { initialEntries: ['/explorar/lugares/tekit/corredor-textil'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a itinerario' }))
    expect(router.state.location.pathname).toBe('/login')
    expect((router.state.location.state as { desde: string }).desde).toContain('agregarLugar=corredor-textil')
  })

  it('reutiliza el borrador actual del mismo destino sin guardarlo', () => {
    const fuente = '/rutas/tekit/personalizar?estancia=ruta-textil&fecha=2026-12-02&inicio=10%3A00&minutos=180&modo=personalizado&lugares=taller-bordado'
    const router = createMemoryRouter([
      { path: '/explorar/lugares/:destino/:id', element: <ExplorarDetallePage /> },
      { path: '/rutas/tekit/personalizar', element: <p>Borrador abierto</p> },
    ], { initialEntries: [{ pathname: '/explorar/lugares/tekit/corredor-textil', state: { borradorFuente: fuente } }] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a itinerario' }))
    expect(screen.getByText(/Borrador actual · sin guardar/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al borrador actual' }))
    const params = new URLSearchParams(router.state.location.search)
    expect(params.get('lugares')).toBe('taller-bordado,corredor-textil')
    expect(params.get('modo')).toBe('personalizado')
    expect(params.get('generado')).toBeNull()
    expect(localStorage.length).toBe(0)
  })
})
