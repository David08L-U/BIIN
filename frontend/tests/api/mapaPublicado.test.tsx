import type { ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MapaRecorrido from '../../src/maps/MapaRecorrido'
import SalidasRuta from '../../src/features/transporte/components/SalidasRuta'
import FotografiaPublicada from '../../src/components/ui/FotografiaPublicada'

const mapa = vi.hoisted(() => ({ fitBounds: vi.fn() }))
vi.mock('react-leaflet', () => ({
  useMap: () => mapa,
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  CircleMarker: ({ children }: { children: ReactNode }) => <span data-testid="marcador">{children}</span>,
  Popup: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Polyline: ({ positions }: { positions: number[][] }) => <span data-testid="trazo">{JSON.stringify(positions)}</span>,
}))
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

describe('mapas y vigencia en la interfaz', () => {
  it('no inventa una ubicación cuando no hay coordenadas', () => {
    render(<MapaRecorrido paradas={[]} />)
    expect(screen.getByRole('status')).toHaveTextContent('No hay coordenadas publicadas')
    expect(mapa.fitBounds).not.toHaveBeenCalled()
  })
  it('usa coordenadas publicadas válidas sin unir etapas con un trazo inventado', () => {
    render(<MapaRecorrido paradas={[{ latitud: 20.9, longitud: -89.6, nombre: 'Punto ficticio' }, { latitud: NaN, longitud: 300 }]} />)
    expect(screen.getAllByTestId('marcador')).toHaveLength(1)
    expect(screen.queryByTestId('trazo')).not.toBeInTheDocument()
    expect(mapa.fitBounds).toHaveBeenCalledWith([[20.9, -89.6]], expect.anything())
  })
  it('dibuja el trazo únicamente cuando lo recibe como dato', () => {
    render(<MapaRecorrido paradas={[]} trazo={[{ latitud: 20.9, longitud: -89.6 }, { latitud: 21, longitud: -89.5 }]} />)
    expect(screen.getByTestId('trazo')).toHaveTextContent('[[20.9,-89.6],[21,-89.5]]')
  })
  it('cambia un reporte a sin confirmar cuando vence con la página abierta', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-12-01T14:00:00Z'))
    render(<SalidasRuta salidas={[{ idSalida: 1, idRuta: 901, unidad: 'PRUEBA', salidaProgramada: '2026-12-01T15:00:00Z', capacidadHabilitada: 10, estadoSalida: 'programada', estadoCupo: 'vigente', asientosDisponibles: 0, registradoEn: '2026-12-01T13:59:00Z', validoHasta: '2026-12-01T14:00:02Z' }]} />)
    expect(screen.getByText('0 asientos disponibles')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByText('Disponibilidad sin confirmar')).toBeInTheDocument()
  })
  it('recupera la fotografía cuando la API cambia una URL que había fallado', () => {
    const { rerender } = render(<FotografiaPublicada src="/fallo.jpg" alt="Lugar ficticio" />)
    fireEvent.error(screen.getByRole('img', { name: 'Lugar ficticio' }))
    expect(screen.getByText('Fotografía no disponible')).toBeInTheDocument()
    rerender(<FotografiaPublicada src="/nueva.jpg" alt="Lugar ficticio" />)
    expect(screen.getByRole('img', { name: 'Lugar ficticio' })).toHaveAttribute('src', '/nueva.jpg')
  })
})
