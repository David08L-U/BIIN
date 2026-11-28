import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RutasPage from '../../src/features/transporte/pages/RutasPage'
import InicioPage from '../../src/features/transporte/pages/InicioPage'
import ElegirItinerarioPage from '../../src/features/explorar/pages/ElegirItinerarioPage'
import { montar, pagina, resumenRecorrido, resumenRuta, simularApi } from './fixtures'

vi.mock('../../src/features/transporte/components/MapaInicio', () => ({ default: () => <div>Mapa de Inicio</div> }))
afterEach(() => vi.unstubAllGlobals())

describe('catálogos publicados', () => {
  it('muestra un destino adicional y enlaces con ids de la API', async () => {
    simularApi(() => pagina([resumenRuta(1234, 'Destino adicional')]))
    montar(<RutasPage />, '/rutas', '/rutas')
    expect(await screen.findByRole('link', { name: 'Ver ruta a Destino adicional' })).toHaveAttribute('href', '/rutas/1234')
    expect(screen.queryByText('Izamal')).not.toBeInTheDocument()
  })
  it('combina búsqueda del servidor con filtros del catálogo completo', async () => {
    const fetch = simularApi(() => pagina([{ ...resumenRuta(1, 'A'), totalParadas: 2 }, { ...resumenRuta(2, 'B'), totalParadas: 5 }]))
    montar(<RutasPage />, '/rutas', '/rutas')
    await screen.findByRole('link', { name: 'Ver ruta a B' })
    fireEvent.click(screen.getByRole('button', { name: 'Sin paradas intermedias' }))
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Ver ruta a B' })).not.toBeInTheDocument())
    expect(await screen.findByRole('link', { name: 'Ver ruta a A' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Buscar rutas o destinos'), { target: { value: 'Homún & Mérida' } })
    await waitFor(() => expect(fetch.mock.calls.some(c => new URL(String(c[0]), 'https://biin.test').searchParams.get('busqueda') === 'Homún & Mérida')).toBe(true))
  })
  it('distingue un catálogo vacío de un error de conexión', async () => {
    simularApi(() => pagina([]))
    montar(<RutasPage />, '/rutas', '/rutas')
    expect(await screen.findByRole('heading', { name: 'No encontramos rutas' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('Inicio usa los mismos ids sin tarifas del prototipo', async () => {
    simularApi(() => pagina([{ ...resumenRuta(555, 'Nuevo pueblo'), tarifaAproximada: 7.5 }]))
    montar(<InicioPage />, '/', '/')
    expect(await screen.findByRole('link', { name: 'Ver ruta a Nuevo pueblo' })).toHaveAttribute('href', '/rutas/555')
    expect(screen.getByText(/7.50/)).toBeInTheDocument()
  })
  it('ofrece cualquier recorrido publicado por localidad', async () => {
    const fetch = simularApi(() => pagina([resumenRecorrido(777)]))
    montar(<ElegirItinerarioPage />, '/recorridos', '/recorridos?localidad=802')
    expect(await screen.findByRole('link', { name: 'Itinerario recomendado' })).toHaveAttribute('href', '/recorridos/777/itinerario')
    expect(fetch.mock.calls[0][0]).toContain('idLocalidadBase=802')
  })
})
