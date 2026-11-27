import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ItinerarioGuardadoPage from '../../src/features/mi-viaje/pages/ItinerarioGuardadoPage'
import { itinerario, montar, pagina, simularApi } from './fixtures'

vi.mock('../../src/maps/MapaRecorrido', () => ({ default: () => <div>Mapa de prueba</div> }))
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })

describe('edición de itinerarios normalizados', () => {
  it('edita horarios en Yucatán y envía ISO UTC con las notas', async () => {
    const i = itinerario()
    const fetch = simularApi((_url, init) => { if (init.method === 'PUT') { const datos = JSON.parse(init.body as string); i.actividades[0] = { ...i.actividades[0], ...datos } } return i })
    montar(<ItinerarioGuardadoPage />, '/mi-viaje/:idItinerario', '/mi-viaje/345')
    const inicios = await screen.findAllByLabelText('Inicio en Yucatán')
    fireEvent.change(inicios[0], { target: { value: '2026-12-01T09:30' } })
    fireEvent.change(screen.getAllByLabelText('Fin en Yucatán')[0], { target: { value: '2026-12-01T10:15' } })
    fireEvent.change(screen.getAllByLabelText('Notas')[0], { target: { value: 'Llevar agua' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Guardar actividad' })[0])
    await waitFor(() => expect(fetch.mock.calls.filter(c => c[1]?.method === 'PUT')).toHaveLength(1))
    const llamada = fetch.mock.calls.find(c => c[1]?.method === 'PUT')!
    expect(llamada[0]).toBe('/api/itinerarios/345/actividades/1001')
    expect(JSON.parse(llamada[1]!.body as string)).toEqual({ inicioPrevisto: '2026-12-01T15:30:00.000Z', finPrevisto: '2026-12-01T16:15:00.000Z', notas: 'Llevar agua' })
    await waitFor(() => expect(screen.getAllByLabelText('Notas')[0]).toHaveValue('Llevar agua'))
  })
  it('reordena por ids de actividad y utiliza el resultado del servidor', async () => {
    const i = itinerario()
    const fetch = simularApi((_url, init) => {
      if (init.method === 'PUT') { const datos = JSON.parse(init.body as string); i.actividades = datos.idActividades.map((id: number, orden: number) => ({ ...i.actividades.find(a => a.idActividad === id)!, orden: orden + 1 })) }
      return i
    })
    montar(<ItinerarioGuardadoPage />, '/mi-viaje/:idItinerario', '/mi-viaje/345')
    fireEvent.click(await screen.findByRole('button', { name: 'Subir [PRUEBA] Cocina' }))
    await waitFor(() => expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Cocina'))
    const llamada = fetch.mock.calls.find(c => c[1]?.method === 'PUT')!
    expect(llamada[0]).toBe('/api/itinerarios/345/actividades/orden')
    expect(JSON.parse(llamada[1]!.body as string)).toEqual({ idActividades: [1002, 1001] })
  })
  it('pide confirmar antes de quitar una actividad', async () => {
    const i = itinerario()
    const fetch = simularApi((_url, init) => { if (init.method === 'DELETE') i.actividades = i.actividades.slice(1); return i })
    montar(<ItinerarioGuardadoPage />, '/mi-viaje/:idItinerario', '/mi-viaje/345')
    const museo = (await screen.findByRole('heading', { name: '[PRUEBA] Museo' })).parentElement!
    fireEvent.click(within(museo).getByRole('button', { name: 'Quitar actividad' }))
    expect(fetch.mock.calls.filter(c => c[1]?.method === 'DELETE')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar quitar' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: '[PRUEBA] Museo' })).not.toBeInTheDocument())
    expect(fetch.mock.calls.some(c => c[0] === '/api/itinerarios/345/actividades/1001' && c[1]?.method === 'DELETE')).toBe(true)
  })
  it('agrega recursos de la búsqueda publicada con su identificador', async () => {
    const i = itinerario()
    const fetch = simularApi((url, init) => {
      if (url.pathname === '/api/explorar') return pagina([{ idRecurso: 999, tipo: 'lugar', titulo: '[PRUEBA] Nuevo lugar', localidad: 'Otro destino' }])
      if (init.method === 'POST') i.actividades.push({ ...i.actividades[0], idActividad: 1999, idRecurso: 999, orden: 3, titulo: '[PRUEBA] Nuevo lugar' })
      return i
    })
    montar(<ItinerarioGuardadoPage />, '/mi-viaje/:idItinerario', '/mi-viaje/345')
    fireEvent.change(await screen.findByLabelText('Buscar contenido publicado'), { target: { value: 'Nuevo' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Agregar [PRUEBA] Nuevo lugar' }))
    expect(await screen.findByRole('heading', { name: '[PRUEBA] Nuevo lugar' })).toBeInTheDocument()
    const llamada = fetch.mock.calls.find(c => c[1]?.method === 'POST')!
    expect(JSON.parse(llamada[1]!.body as string)).toEqual({ idRecurso: 999 })
  })
  it('presenta advertencias reales sin ocultar eventos cancelados', async () => {
    simularApi(() => ({ ...itinerario(), advertencias: [{ tipo: 'evento_cancelado', mensaje: 'El evento publicado fue cancelado.', idActividades: [1001] }] }))
    montar(<ItinerarioGuardadoPage />, '/mi-viaje/:idItinerario', '/mi-viaje/345')
    expect(await screen.findByText('El evento publicado fue cancelado.')).toBeInTheDocument()
  })
  it('no permite seguir escribiendo tras una desconexión hasta recargar', async () => {
    simularApi((_url, init) => { if (init.method === 'PUT') throw new TypeError('red'); return itinerario() })
    montar(<ItinerarioGuardadoPage />, '/mi-viaje/:idItinerario', '/mi-viaje/345')
    fireEvent.click(await screen.findByRole('button', { name: 'Guardar datos del viaje' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Recarga el itinerario')
    expect(screen.getByRole('button', { name: 'Guardar datos del viaje' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Recargar itinerario' }))
    expect(await screen.findByRole('button', { name: 'Guardar datos del viaje' })).toBeEnabled()
  })
  it('muestra un itinerario ajeno como no encontrado y no usa copia local', async () => {
    simularApi(() => new Response(JSON.stringify({ detail: 'Itinerario no encontrado' }), { status: 404 }))
    montar(<ItinerarioGuardadoPage />, '/mi-viaje/:idItinerario', '/mi-viaje/345')
    expect(await screen.findByRole('alert')).toHaveTextContent('Itinerario no encontrado')
    expect(screen.queryByLabelText('Nombre del itinerario')).not.toBeInTheDocument()
  })
  it('rechaza ids inválidos sin consultar el servidor', async () => {
    const fetch = simularApi(() => itinerario())
    montar(<ItinerarioGuardadoPage />, '/mi-viaje/:idItinerario', '/mi-viaje/0')
    expect(await screen.findByRole('alert')).toHaveTextContent('no es válido')
    expect(fetch).not.toHaveBeenCalled()
  })
})
