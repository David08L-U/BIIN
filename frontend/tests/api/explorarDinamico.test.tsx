import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ExplorarPage, { ExplorarDetallePage } from '../../src/features/explorar/pages/ExplorarPage'
import { contexto, itinerario, montar, pagina, simularApi } from './fixtures'

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })
const contenido = { idRecurso: 721, titulo: '[PRUEBA] Jardín', descripcion: 'Sitio ficticio', actualizadoEn: '2026-11-27T18:00:00Z', ubicacion: { idLocalidad: 802, localidad: 'Nuevo destino', municipio: 'Municipio ficticio', direccionReferencia: null, latitud: 20.9, longitud: -89.6 }, categorias: [{ idCategoria: 1, nombre: 'Cultura' }], fotografias: [], costoAcceso: 0, condicionesAcceso: null, horarios: [] }
describe('exploración conectada', () => {
  it('consulta filtros y crea enlaces por tipo e id', async () => {
    const fetch = simularApi(() => pagina([{ ...contenido, tipo: 'lugar', localidad: 'Nuevo destino', categorias: ['Cultura'] }]))
    const { router } = montar(<ExplorarPage />, '/explorar', '/explorar?tipo=lugar&localidad=802')
    expect(await screen.findByRole('link', { name: 'Ver detalle de [PRUEBA] Jardín' })).toHaveAttribute('href', '/explorar/lugar/721')
    expect(fetch.mock.calls[0][0]).toContain('idLocalidad=802')
    fireEvent.change(screen.getByLabelText('Buscar contenido'), { target: { value: 'jardín' } })
    await waitFor(() => expect(fetch.mock.calls.some(c => new URL(String(c[0]), 'https://biin.test').searchParams.get('busqueda') === 'jardín')).toBe(true))
    expect(router.state.location.search).toContain('tipo=lugar')
  })
  it('muestra costo cero y foto ausente como datos distintos', async () => {
    simularApi(url => url.pathname === '/api/lugares/721' ? contenido : [])
    montar(<ExplorarDetallePage />, '/explorar/:tipo/:id', '/explorar/lugar/721', contexto(null))
    expect(await screen.findByRole('heading', { name: '[PRUEBA] Jardín' })).toBeInTheDocument()
    expect(screen.getByText(/Costo de acceso: \$0.00/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '[PRUEBA] Jardín' })).toHaveTextContent('Fotografía no disponible')
    expect(screen.getByRole('link', { name: 'Planear visita en Nuevo destino' })).toHaveAttribute('href', '/recorridos?localidad=802')
  })
  it('agrega el recurso real a un itinerario seleccionado de la cuenta', async () => {
    const fetch = simularApi((url, init) => url.pathname === '/api/lugares/721' ? contenido : init.method === 'POST' ? itinerario() : [{ ...itinerario(), totalActividades: 2 }])
    montar(<ExplorarDetallePage />, '/explorar/:tipo/:id', '/explorar/lugar/721', contexto(), [{ path: '/mi-viaje/:id', element: <h1>Viaje actualizado</h1> }])
    await screen.findByRole('option', { name: /Mi visita/ })
    fireEvent.change(screen.getByLabelText('Itinerario'), { target: { value: '345' } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar actividad al viaje' }))
    expect(await screen.findByRole('heading', { name: 'Viaje actualizado' })).toBeInTheDocument()
    const escritura = fetch.mock.calls.find(c => c[1]?.method === 'POST')!
    expect(escritura[0]).toBe('/api/itinerarios/345/actividades')
    expect(JSON.parse(escritura[1]!.body as string)).toEqual({ idRecurso: 721 })
  })
  it('rechaza un tipo o identificador no permitido sin hacer consultas', async () => {
    const fetch = simularApi(() => contenido)
    montar(<ExplorarDetallePage />, '/explorar/:tipo/:id', '/explorar/desconocido/0')
    expect(await screen.findByRole('alert')).toHaveTextContent('contenido no es válido')
    expect(fetch).not.toHaveBeenCalled()
  })
})
