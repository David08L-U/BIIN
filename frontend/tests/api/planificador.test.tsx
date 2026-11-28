import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PlanificadorPage from '../../src/features/mi-viaje/pages/PlanificadorPage'
import { cargarContextoPlanApi } from '../../src/features/mi-viaje/hooks/useContextoPlanApi'
import { contexto, itinerario, montar, pagina, recorrido, resumenRecorrido, ruta, simularApi } from './fixtures'

vi.mock('../../src/maps/MapaRecorrido', () => ({ default: () => <div>Mapa de prueba</div> }))
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })
const entrada = '/rutas/901/itinerario?recorrido=551&inicio=2026-12-01&fin=2026-12-02'
function responder(url: URL, init: RequestInit) {
  if (init.method === 'POST') return itinerario()
  if (url.pathname === '/api/rutas/901') return ruta()
  if (url.pathname === '/api/recorridos/551') return recorrido()
  return pagina([resumenRecorrido()])
}
describe('pantalla compartida de planificación', () => {
  it('guarda el recomendado en el servidor y abre el id devuelto', async () => {
    const fetch = simularApi(responder)
    montar(<PlanificadorPage modo="recomendado" />, '/rutas/:id/itinerario', entrada, contexto(), [{ path: '/mi-viaje/:id', element: <h1>Viaje del servidor</h1> }])
    fireEvent.click(await screen.findByRole('button', { name: 'Guardar itinerario en mi cuenta' }))
    expect(await screen.findByRole('heading', { name: 'Viaje del servidor' })).toBeInTheDocument()
    expect(fetch.mock.calls.some(c => c[0] === '/api/itinerarios/desde-recorrido/551' && c[1]?.method === 'POST')).toBe(true)
  })
  it('mantiene la configuración antes de pedir sesión sin crear itinerarios', async () => {
    const fetch = simularApi(responder)
    const { router } = montar(<PlanificadorPage modo="recomendado" />, '/rutas/:id/itinerario', entrada, contexto(null), [{ path: '/login', element: <h1>Acceso</h1> }])
    fireEvent.change(await screen.findByLabelText('Nombre del itinerario'), { target: { value: 'Mi borrador personal' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión para guardar' }))
    await screen.findByRole('heading', { name: 'Acceso' })
    expect(router.state.location.state.desde).toContain('nombre=Mi+borrador+personal')
    expect(fetch.mock.calls.filter(c => c[1]?.method === 'POST')).toHaveLength(0)
  })
  it('permite quitar y reordenar etapas sin perder selección al alternar modo', async () => {
    simularApi(responder)
    const { router } = montar(<PlanificadorPage modo="personalizado" />, '/rutas/:id/itinerario', entrada)
    const orden = await screen.findByRole('heading', { name: 'Orden de visita' })
    fireEvent.click(screen.getByRole('button', { name: 'Subir [PRUEBA] Cocina' }))
    expect(new URLSearchParams(router.state.location.search).get('seleccion')).toBe('2,1')
    expect(within(orden.parentElement!).getAllByRole('listitem')[0]).toHaveTextContent('Cocina')
    fireEvent.click(screen.getByLabelText('Seleccionar [PRUEBA] Museo'))
    expect(new URLSearchParams(router.state.location.search).get('seleccion')).toBe('2')
    expect(screen.getByRole('link', { name: 'Recomendado' }).getAttribute('href')).toContain('seleccion=2')
  })
  it('rechaza un recorrido de otro destino antes de consultar sus etapas', async () => {
    const fetch = simularApi(responder)
    await expect(cargarContextoPlanApi('901', undefined, '999')).rejects.toThrow(/no pertenece/)
    expect(fetch.mock.calls.some(c => c[0] === '/api/recorridos/999')).toBe(false)
  })
  it('comunica ausencia de recomendaciones sin recuperar datos fijos', async () => {
    simularApi(url => url.pathname === '/api/rutas/901' ? ruta() : pagina([]))
    montar(<PlanificadorPage modo="recomendado" />, '/rutas/:id/itinerario', entrada.split('?')[0])
    expect(await screen.findByText('No hay recorridos publicados para este destino.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Guardar itinerario/ })).not.toBeInTheDocument()
  })
  it('evita guardar fechas inválidas y selecciones sin actividades', async () => {
    const fetch = simularApi(responder)
    montar(<PlanificadorPage modo="personalizado" />, '/rutas/:id/itinerario', entrada)
    fireEvent.change(await screen.findByLabelText('Fecha final'), { target: { value: '2026-11-30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar itinerario en mi cuenta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('anterior')
    expect(fetch.mock.calls.filter(c => c[1]?.method === 'POST')).toHaveLength(0)
    fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '2026-12-02' } })
    fireEvent.click(screen.getByLabelText('Seleccionar [PRUEBA] Museo'))
    fireEvent.click(screen.getByLabelText('Seleccionar [PRUEBA] Cocina'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar itinerario en mi cuenta' })).toBeDisabled())
  })
})
