import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MapaInicio from '../src/features/transporte/components/MapaInicio'

const mapa = vi.hoisted(() => ({ panTo: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn() }))
vi.mock('react-leaflet', () => ({
  useMap: () => mapa,
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Circle: ({ radius }: { radius: number }) => <i data-testid="precision" data-radio={radius} />,
  Marker: ({ position, icon, children }: { position: [number, number]; icon: { options: { iconUrl: string } }; children: ReactNode }) => <>
    <img data-testid="ubicacion" data-punto={position.join(',')} src={icon.options.iconUrl} alt="" />{children}
  </>,
  Tooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

function simularAPI() {
  let recibir: PositionCallback
  let fallar: PositionErrorCallback
  const watchPosition = vi.fn((exito: PositionCallback, error: PositionErrorCallback) => {
    recibir = exito
    fallar = error
    return 0
  })
  const clearWatch = vi.fn()
  vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch } })
  return {
    watchPosition,
    clearWatch,
    recibir: (latitude: number, longitude: number, accuracy: number) => act(() => recibir({
      coords: { latitude, longitude, accuracy },
    } as GeolocationPosition)),
    fallar: (code: number) => act(() => fallar({ code } as GeolocationPositionError)),
  }
}

function usarUbicacion() {
  fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))
}

beforeEach(() => {
  vi.stubGlobal('isSecureContext', true)
  mapa.panTo.mockClear()
})
afterEach(() => vi.unstubAllGlobals())

describe('ubicación de Inicio con la API simulada', () => {
  it('pide permiso mediante el botón, actualiza el punto y centra solo al iniciar o a petición', () => {
    const api = simularAPI()
    const { unmount } = render(<MapaInicio />)
    expect(api.watchPosition).not.toHaveBeenCalled()
    expect(screen.queryByTestId('ubicacion')).not.toBeInTheDocument()
    expect(screen.getByText(/Vista general de Mérida/)).toBeInTheDocument()

    usarUbicacion()
    usarUbicacion()
    expect(api.watchPosition).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Solicitando ubicación/)).toBeInTheDocument()
    expect(screen.queryByTestId('ubicacion')).not.toBeInTheDocument()
    api.recibir(1, 2, 75)
    expect(screen.getByTestId('ubicacion')).toHaveAttribute('data-punto', '1,2')
    expect(screen.getByTestId('ubicacion')).toHaveAttribute('src', expect.stringContaining('marquesita-melanie.jpg'))
    expect(screen.getByText('Tu ubicación')).toBeInTheDocument()
    expect(screen.getByTestId('precision')).toHaveAttribute('data-radio', '75')
    expect(screen.getByText(/Tu ubicación aproximada.*75 m/)).toBeInTheDocument()
    expect(mapa.panTo).toHaveBeenCalledExactlyOnceWith([1, 2], { animate: false })

    api.recibir(2, 3, 30)
    expect(screen.getByTestId('ubicacion')).toHaveAttribute('data-punto', '2,3')
    expect(screen.getByTestId('precision')).toHaveAttribute('data-radio', '30')
    expect(mapa.panTo).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Centrar en mi ubicación' }))
    expect(mapa.panTo).toHaveBeenLastCalledWith([2, 3], { animate: false })
    expect(api.watchPosition).toHaveBeenCalledTimes(1)
    unmount()
    expect(api.clearWatch).toHaveBeenCalledExactlyOnceWith(0)
    api.recibir(3, 4, 10)
    expect(mapa.panTo).toHaveBeenCalledTimes(2)
  })

  it.each([
    [1, /Permiso de ubicación rechazado.*permisos del sitio.*permite Ubicación/],
    [2, /Ubicación no disponible/],
    [3, /Se agotó el tiempo de espera/],
  ] as const)('muestra el fallo %i y conserva la vista de referencia sin marcador', (codigo, mensaje) => {
    const api = simularAPI()
    render(<MapaInicio />)
    usarUbicacion()
    api.fallar(codigo)
    expect(screen.getByText(mensaje)).toBeInTheDocument()
    expect(screen.getByText(/Vista general de Mérida/)).toBeInTheDocument()
    expect(screen.queryByTestId('ubicacion')).not.toBeInTheDocument()
    expect(api.clearWatch).toHaveBeenCalledExactlyOnceWith(0)
    usarUbicacion()
    expect(api.watchPosition).toHaveBeenCalledTimes(2)
  })

  it('marca como desactualizada la última lectura si el seguimiento falla', () => {
    const api = simularAPI()
    render(<MapaInicio />)
    usarUbicacion()
    api.recibir(1, 2, 40)
    api.fallar(2)
    expect(screen.getByText(/Última ubicación desactualizada.*40 m/)).toBeInTheDocument()
    expect(screen.queryByText(/Tu ubicación aproximada/)).not.toBeInTheDocument()
    expect(api.clearWatch).toHaveBeenCalledExactlyOnceWith(0)
  })

  it('explica que el navegador carece de geolocalización', () => {
    vi.stubGlobal('navigator', {})
    render(<MapaInicio />)
    usarUbicacion()
    expect(screen.getByText(/navegador no admite la geolocalización/)).toBeInTheDocument()
  })

  it('explica que se necesita un contexto seguro antes de solicitar permiso', () => {
    const api = simularAPI()
    vi.stubGlobal('isSecureContext', false)
    render(<MapaInicio />)
    usarUbicacion()
    expect(screen.getByText(/requiere una conexión segura/)).toBeInTheDocument()
    expect(api.watchPosition).not.toHaveBeenCalled()
  })
})
