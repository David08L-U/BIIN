import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { latLng } from 'leaflet'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MapaInicio from '../src/features/transporte/components/MapaInicio'
import { limitesUbicacion } from '../src/maps/encuadreUbicacion'

const mapa = vi.hoisted(() => ({ fitBounds: vi.fn(), getContainer: () => document.body, zoomIn: vi.fn(), zoomOut: vi.fn() }))
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
  const accion = screen.queryByRole('button', { name: /Usar mi ubicaci/ }) ?? document.querySelector('.melanie-controles button.biin-icon-button')!
  fireEvent.click(accion)
}

beforeEach(() => {
  vi.stubGlobal('isSecureContext', true)
  mapa.fitBounds.mockClear()
})
afterEach(() => vi.unstubAllGlobals())

describe('ubicación de Inicio con la API simulada', () => {
  it.each([0, 21, 60])('cubre unos 2 km hacia el norte y el este a latitud %i', latitud => {
    const centro = latLng(latitud, -30)
    const limites = limitesUbicacion([centro.lat, centro.lng])
    const radios = [centro.distanceTo([limites.getNorth(), centro.lng]), centro.distanceTo([centro.lat, limites.getEast()])]
    for (const radio of radios) {
      expect(radio).toBeGreaterThan(1980)
      expect(radio).toBeLessThan(2020)
    }
  })

  it('pide permiso mediante el botón, actualiza el punto y centra solo al iniciar o a petición', () => {
    const api = simularAPI()
    const { unmount } = render(<MapaInicio />)
    expect(api.watchPosition).not.toHaveBeenCalled()
    expect(screen.queryByTestId('ubicacion')).not.toBeInTheDocument()
    expect(screen.getByText(/Vista general de Mérida/)).toBeInTheDocument()
    expect(screen.getByText('¿Quieres usar tu ubicación para centrar el mapa?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(screen.queryByText('¿Quieres usar tu ubicación para centrar el mapa?')).not.toBeInTheDocument()

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
    expect(mapa.fitBounds).toHaveBeenCalledTimes(1)
    const encuadre = mapa.fitBounds.mock.calls[0][0]
    expect(encuadre.getCenter()).toEqual(latLng(1, 2))
    expect(latLng(1, 2).distanceTo([encuadre.getNorth(), 2])).toBeCloseTo(1998, 0)

    api.recibir(2, 3, 30)
    expect(screen.getByTestId('ubicacion')).toHaveAttribute('data-punto', '2,3')
    expect(screen.getByTestId('precision')).toHaveAttribute('data-radio', '30')
    expect(mapa.fitBounds).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /Mi ubicaci/ }))
    expect(mapa.fitBounds.mock.lastCall?.[0].getCenter()).toEqual(latLng(2, 3))
    expect(api.watchPosition).toHaveBeenCalledTimes(1)
    unmount()
    expect(api.clearWatch).toHaveBeenCalledExactlyOnceWith(0)
    api.recibir(3, 4, 10)
    expect(mapa.fitBounds).toHaveBeenCalledTimes(2)
  })

  it('reanuda un único seguimiento al entrar si el permiso ya está concedido', async () => {
    const api = simularAPI()
    const estado = Object.assign(new EventTarget(), { state: 'granted', onchange: null }) as PermissionStatus
    vi.stubGlobal('navigator', {
      geolocation: { watchPosition: api.watchPosition, clearWatch: api.clearWatch },
      permissions: { query: vi.fn().mockResolvedValue(estado) },
    })
    const { unmount } = render(<MapaInicio />)
    await waitFor(() => expect(api.watchPosition).toHaveBeenCalledTimes(1))
    expect(screen.queryByTestId('ubicacion')).not.toBeInTheDocument()
    expect(screen.queryByText('¿Quieres usar tu ubicación para centrar el mapa?')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Usar ubicaci/ }))
    expect(api.watchPosition).toHaveBeenCalledTimes(1)
    unmount()
    expect(api.clearWatch).toHaveBeenCalledExactlyOnceWith(0)
  })

  it('inicia el seguimiento solo al aceptar la invitación y evita duplicados', () => {
    const api = simularAPI()
    render(<MapaInicio />)
    expect(api.watchPosition).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Usar mi ubicaci/ }))
    expect(api.watchPosition).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Quieres usar tu ubicaci/)).not.toBeInTheDocument()
    usarUbicacion()
    expect(api.watchPosition).toHaveBeenCalledTimes(1)
  })

  it('no repite la solicitud si el permiso ya está rechazado en el navegador', async () => {
    const api = simularAPI()
    const estado = Object.assign(new EventTarget(), { state: 'denied', onchange: null }) as PermissionStatus
    vi.stubGlobal('navigator', {
      geolocation: { watchPosition: api.watchPosition, clearWatch: api.clearWatch },
      permissions: { query: vi.fn().mockResolvedValue(estado) },
    })
    render(<MapaInicio />)
    await waitFor(() => expect(screen.getByText(/Permiso de ubicaci/)).toBeInTheDocument())
    expect(screen.queryByText(/Quieres usar tu ubicaci/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Usar ubicaci/ }))
    expect(api.watchPosition).not.toHaveBeenCalled()
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
    expect(api.watchPosition).toHaveBeenCalledTimes(codigo === 1 ? 1 : 2)
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
