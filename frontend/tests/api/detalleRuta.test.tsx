import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DetalleRutaPage from '../../src/features/transporte/pages/DetalleRutaPage'
import { montar, pagina, resumenRecorrido, resumenRuta, ruta, simularApi } from './fixtures'

vi.mock('../../src/maps/MapaRecorrido', () => ({ default: () => <div>Mapa de prueba</div> }))
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })

describe('un detalle para todos los destinos', () => {
  it.each(['Izamal', 'Valladolid', 'Tekit', 'Homún', 'Ticul', 'Destino adicional'])('lee %s del servidor con el mismo componente', async destino => {
    const fetch = simularApi(url => url.pathname === '/api/rutas/901' ? ruta(901, destino) : pagina([resumenRecorrido()]))
    montar(<DetalleRutaPage />, '/rutas/:id', '/rutas/901')
    expect(await screen.findByRole('heading', { name: `[PRUEBA] Ruta a ${destino}` })).toBeInTheDocument()
    expect(fetch.mock.calls.some(c => c[0] === '/api/rutas/901')).toBe(true)
    expect(await screen.findByRole('link', { name: 'Personalizar mi itinerario' })).toHaveAttribute('href', '/rutas/901/personalizar?recorrido=551')
    expect(screen.getByText('Sin tarifas vigentes publicadas.')).toBeInTheDocument()
  })
  it('actualiza el contenido cuando cambia el id de URL y aísla favoritos', async () => {
    simularApi(url => url.pathname.startsWith('/api/rutas/') ? ruta(Number(url.pathname.split('/').at(-1)), url.pathname.endsWith('901') ? 'Primero' : 'Segundo') : pagina([]))
    const { router } = montar(<DetalleRutaPage />, '/rutas/:id', '/rutas/901')
    const favorito = await screen.findByRole('button', { name: 'Guardar ruta en este navegador' })
    fireEvent.click(favorito)
    expect(favorito).toHaveAttribute('aria-pressed', 'true')
    await act(async () => router.navigate('/rutas/902'))
    expect(await screen.findByRole('heading', { name: '[PRUEBA] Ruta a Segundo' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '[PRUEBA] Ruta a Primero' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar ruta en este navegador' })).toHaveAttribute('aria-pressed', 'false')
  })
  it('filtra los horarios recibidos de la API por día y conserva las vigencias', async () => {
    const datos = ruta()
    datos.horarios = [
      { idHorario: 501, diaSemana: 1, horaSalida: '09:20:00', vigenteDesde: '2020-01-01', vigenteHasta: '2020-12-31' },
      { idHorario: 502, diaSemana: 6, horaSalida: '16:40:00', vigenteDesde: '2027-01-01', vigenteHasta: null },
    ]
    simularApi(url => url.pathname === '/api/rutas/901' ? datos : pagina([resumenRecorrido()]))
    montar(<DetalleRutaPage />, '/rutas/:id', '/rutas/901')
    const selector = await screen.findByRole('combobox', { name: 'Día de la semana' })
    fireEvent.change(selector, { target: { value: '1' } })
    expect(screen.getByText('09:20')).toBeInTheDocument()
    expect(screen.getByText('2020-12-31')).toBeInTheDocument()
    expect(screen.queryByText('16:40')).not.toBeInTheDocument()
    fireEvent.change(selector, { target: { value: '6' } })
    expect(screen.getByText('16:40')).toBeInTheDocument()
    expect(screen.getByText('2027-01-01')).toBeInTheDocument()
    expect(screen.queryByText('09:20')).not.toBeInTheDocument()
    expect(screen.getAllByText('Hora de Yucatán')).toHaveLength(1)
    expect(await screen.findByRole('link', { name: 'Ver itinerario recomendado' })).toHaveAttribute('href', '/rutas/901/itinerario?recorrido=551')
  })
  it('muestra 404 y permite reintentar sin inventar un destino', async () => {
    let falla = true
    simularApi(url => url.pathname.includes('/recorridos') ? pagina([]) : falla ? new Response(JSON.stringify({ detail: 'Ruta retirada' }), { status: 404 }) : ruta())
    montar(<DetalleRutaPage />, '/rutas/:id', '/rutas/901')
    expect(await screen.findByRole('alert')).toHaveTextContent('Ruta retirada')
    expect(screen.queryByText(/Ciudad Amarilla/)).not.toBeInTheDocument()
    falla = false
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { name: '[PRUEBA] Ruta a Destino de prueba' })).toBeInTheDocument()
  })
  it('resuelve un enlace antiguo por API y pide elegir si hay varias rutas', async () => {
    simularApi(() => pagina([resumenRuta(901, 'Homún'), resumenRuta(902, 'Homún')]))
    montar(<DetalleRutaPage />, '/rutas/:id', '/rutas/homun')
    expect(await screen.findByText('Elige la ruta de transporte:')).toBeInTheDocument()
    expect(screen.getAllByRole('link').filter(a => a.getAttribute('href')?.match(/^\/rutas\/90[12]$/))).toHaveLength(2)
  })
})
