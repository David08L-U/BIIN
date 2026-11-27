import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MiViajePage from '../../src/features/mi-viaje/pages/MiViajePage'
import PerfilPage from '../../src/features/perfil/pages/PerfilPage'
import { AuthContext } from '../../src/features/auth/authContextValor'
import { contexto, itinerario, montar, simularApi } from './fixtures'

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })
const resumen = () => ({ ...itinerario(), totalActividades: 2 })

describe('viajes por cuenta y perfil', () => {
  it('lista el servidor y conserva intactos los borradores antiguos del navegador', async () => {
    localStorage.setItem('biin:itinerarios:v1:1', 'borrador-antiguo')
    simularApi(() => [resumen()])
    montar(<MiViajePage />, '/mi-viaje', '/mi-viaje')
    expect(await screen.findByRole('link', { name: 'Abrir y editar itinerario' })).toHaveAttribute('href', '/mi-viaje/345')
    expect(localStorage.getItem('biin:itinerarios:v1:1')).toBe('borrador-antiguo')
  })
  it('solo elimina tras confirmar y vuelve a consultar la lista', async () => {
    let items = [resumen()]
    const fetch = simularApi((_url, init) => { if (init.method === 'DELETE') { items = []; return new Response(null, { status: 204 }) } return items })
    montar(<MiViajePage />, '/mi-viaje', '/mi-viaje')
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar itinerario' }))
    expect(fetch.mock.calls.filter(c => c[1]?.method === 'DELETE')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    expect(await screen.findByText('Todavía no tienes itinerarios guardados en tu cuenta.')).toBeInTheDocument()
  })
  it('descarta la respuesta pendiente de la cuenta anterior', async () => {
    let resolver!: (valor: unknown) => void
    let cuenta = 1
    simularApi(() => cuenta === 1 ? new Promise(resolve => { resolver = resolve }) : [{ ...resumen(), nombre: '[PRUEBA] Cuenta nueva' }])
    const { rerender, router } = montar(<MiViajePage />, '/mi-viaje', '/mi-viaje')
    await act(async () => {})
    cuenta = 2
    rerender(<AuthContext.Provider value={contexto(2)}><RouterProvider router={router} /></AuthContext.Provider>)
    expect(await screen.findByRole('heading', { name: '[PRUEBA] Cuenta nueva' })).toBeInTheDocument()
    await act(async () => resolver([{ ...resumen(), nombre: '[PRUEBA] Cuenta anterior' }]))
    expect(screen.queryByText('[PRUEBA] Cuenta anterior')).not.toBeInTheDocument()
  })
  it('el perfil muestra recientes del servidor y no inventa métricas', async () => {
    simularApi(() => [resumen()])
    montar(<PerfilPage />, '/perfil', '/perfil')
    expect(await screen.findByRole('heading', { name: '[PRUEBA] Mi visita' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver ruta de [PRUEBA] Mi visita' })).toHaveAttribute('href', '/mi-viaje/345')
    expect(screen.getAllByLabelText('Sin datos disponibles')).toHaveLength(3)
    expect(screen.getByText(/Guardados en tu cuenta de BIIN/)).toBeInTheDocument()
  })
  it('mantiene visible el error de perfil y permite reintentar', async () => {
    let falla = true
    simularApi(() => falla ? new Response(JSON.stringify({ detail: 'Servidor temporalmente no disponible' }), { status: 503 }) : [resumen()])
    montar(<PerfilPage />, '/perfil', '/perfil')
    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor temporalmente no disponible')
    falla = false
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar itinerarios' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: '[PRUEBA] Mi visita' })).toBeInTheDocument())
  })
})
