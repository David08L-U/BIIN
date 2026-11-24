import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Layout from '../src/components/layout/Layout'
import DetalleRutaPage from '../src/features/transporte/pages/DetalleRutaPage'
import RutasPage from '../src/features/transporte/pages/RutasPage'
import ItinerarioIzamalPage from '../src/features/mi-viaje/pages/ItinerarioIzamalPage'
import PersonalizarIzamalPage from '../src/features/mi-viaje/pages/PersonalizarIzamalPage'

vi.mock('../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: null, cerrarSesion: vi.fn(), tieneRol: () => false }),
}))

function montar(ruta = '/rutas/izamal') {
  const router = createMemoryRouter(
    [{
      element: <Layout />,
      children: [
        { path: 'rutas', element: <RutasPage /> },
        { path: 'rutas/:id', element: <DetalleRutaPage /> },
        { path: 'rutas/izamal/itinerario', element: <ItinerarioIzamalPage /> },
        { path: 'rutas/izamal/personalizar', element: <PersonalizarIzamalPage /> },
      ],
    }],
    { initialEntries: [ruta] },
  )

  const vista = render(<RouterProvider router={router} />)
  return { router, ...vista }
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('Detalle de Izamal CU-03 / RF03', () => {
  it('abre Izamal desde el catálogo y muestra su composición', async () => {
    const { router } = montar('/rutas')
    await userEvent.click(screen.getByRole('link', { name: 'Ver ruta a Izamal' }))

    expect(router.state.location.pathname).toBe('/rutas/izamal')
    expect(screen.getByRole('heading', { name: 'Izamal', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Terminal Noreste · Calle 67' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mapeo de ruta y paradas' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Recorrido del prototipo' })).getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByRole('heading', { name: 'Descubre Izamal a tu ritmo' })).toBeInTheDocument()
    expect(screen.getByText(/Tarifa y recorrido del prototipo, pendientes de validar/)).toBeInTheDocument()
    expect(screen.getByText(/El detalle original indica ~58 min; el catálogo, 1 h 15 min/)).toHaveTextContent('Tiempos pendientes de validar')
  })

  it.each(['/rutas/izamal', '/rutas/izamal/'])('mantiene una sola navegación y Rutas activa en %s', ruta => {
    const { container } = montar(ruta)
    const navegacion = screen.getByRole('navigation', { name: 'Navegación principal' })

    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(1)
    expect(within(navegacion).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
    expect(container.querySelector('.biin-cabecera-simple')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Volver a lista de rutas' })).toHaveLength(1)
  })

  it('vuelve al catálogo al entrar directamente por URL, sin historial previo', async () => {
    const { router } = montar()
    await userEvent.click(screen.getByRole('link', { name: 'Volver a lista de rutas' }))

    expect(router.state.location.pathname).toBe('/rutas')
    expect(screen.getByRole('heading', { name: '¿A dónde viajaremos hoy?' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Ver ruta a / })).toHaveLength(5)
  })

  it('selecciona una estancia exclusiva con ratón y teclado', async () => {
    montar()
    const user = userEvent.setup()
    const medioDia = screen.getByRole('radio', { name: /Medio día/ })
    const diaCompleto = screen.getByRole('radio', { name: /Día completo/ })
    const tarde = screen.getByRole('radio', { name: /Tarde mágica/ })

    expect(screen.getByRole('group', { name: 'Tiempo de estancia:' })).toBeInTheDocument()
    expect(medioDia).toBeChecked()
    await user.click(diaCompleto)
    expect(diaCompleto).toBeChecked()
    expect(medioDia).not.toBeChecked()

    await user.keyboard('{ArrowRight}')
    expect(tarde).toBeChecked()
    expect(tarde).toHaveFocus()
    expect(diaCompleto).not.toBeChecked()
  })

  it('alterna el favorito y recupera tanto el guardado como la eliminación al remontar', async () => {
    const user = userEvent.setup()
    const primera = montar()
    expect(screen.getByRole('button', { name: 'Guardar ruta favorita' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: 'Guardar ruta favorita' }))
    expect(screen.getByRole('button', { name: 'Guardar ruta favorita' })).toHaveAttribute('aria-pressed', 'true')
    primera.unmount()

    const segunda = montar()
    expect(screen.getByRole('button', { name: 'Guardar ruta favorita' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/solo en este navegador, sin sincronización con una cuenta/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar ruta favorita' }))
    expect(screen.getByRole('button', { name: 'Guardar ruta favorita' })).toHaveAttribute('aria-pressed', 'false')
    segunda.unmount()

    montar()
    expect(screen.getByRole('button', { name: 'Guardar ruta favorita' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('permite alternar el favorito e informa si el navegador impide persistirlo', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Almacenamiento bloqueado', 'SecurityError')
    })
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar ruta favorita' }))

    expect(screen.getByRole('button', { name: 'Guardar ruta favorita' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/No se pudo acceder al almacenamiento/)).toHaveAttribute('role', 'status')
    expect(screen.getByText(/solo durará mientras esta página esté abierta/)).toBeInTheDocument()
  })

  it('tolera que el navegador impida leer los favoritos', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Almacenamiento bloqueado', 'SecurityError')
    })
    montar()

    expect(screen.getByRole('heading', { name: 'Izamal', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/No se pudo acceder al almacenamiento/)).toBeInTheDocument()
  })

  it('explica los identificadores desconocidos y permite ir al catálogo', async () => {
    const { router } = montar('/rutas/destino-desconocido')
    expect(screen.getByRole('heading', { name: 'Ruta no encontrada' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    expect(router.state.location.pathname).toBe('/rutas')
    expect(screen.getByRole('heading', { name: '¿A dónde viajaremos hoy?' })).toBeInTheDocument()
  })

  it.each(['valladolid', 'tekit', 'homun', 'ticul'])('conserva el detalle provisional de %s', id => {
    montar(`/rutas/${id}`)
    expect(screen.getByRole('heading', { name: 'Detalle de ruta' })).toBeInTheDocument()
    expect(screen.getByText('Este módulo está en desarrollo (CU-03).')).toBeInTheDocument()
  })

  it('no afirma disponibilidad, horarios ni ubicación en tiempo real', () => {
    montar()
    const detalle = screen.getByRole('article', { name: 'Izamal' })
    const asientos = screen.getByRole('region', { name: 'Asientos' })

    expect(within(asientos).getByText('Sin confirmar')).toBeInTheDocument()
    expect(within(asientos).getByText('Sin reporte vigente')).toBeInTheDocument()
    expect(screen.getByText('Salida · Sin confirmar')).toBeInTheDocument()
    expect(screen.getByText('Origen')).toBeInTheDocument()
    expect(detalle).toHaveTextContent('no representa tu ubicación')
    expect(detalle).not.toHaveTextContent(/7\s*(asientos|disponibles)|próxima salida|10:30|10:45|11:05|11:18|11:28|estás aquí|unidad 14/i)
  })

  it.each([
    ['Itinerario recomendado en Izamal', 'itinerario', 'Tu Itinerario en Izamal'],
    ['Personalizar mi itinerario', 'personalizar', 'Personalizar Itinerario'],
  ])('abre %s conservando estancia y sin generar un resultado', async (boton, destino, titulo) => {
    const { router } = montar()
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: /Día completo/ }))
    await user.click(screen.getByRole('button', { name: boton }))
    expect(router.state.location.pathname).toBe(`/rutas/izamal/${destino}`)
    expect(screen.getByRole('heading', { name: titulo, level: 1 })).toBeInTheDocument()
    expect(screen.getByLabelText('Tiempo disponible (minutos)')).toHaveValue(480)
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Volver a detalle de ruta' }))
    expect(screen.getByRole('radio', { name: /Día completo/ })).toBeChecked()
    expect(localStorage.length).toBe(0)
  })

  it('conserva el recorrido y las acciones cuando fallan las imágenes originales', () => {
    montar()
    const mapa = screen.getByRole('img', { name: 'Mapa ilustrativo del recorrido a Izamal del prototipo' })
    const cultura = screen.getByRole('img', { name: 'Imagen cultural de Izamal del prototipo' })
    fireEvent.error(mapa)
    fireEvent.error(cultura)

    expect(screen.getAllByText('Imagen del prototipo no disponible')).toHaveLength(2)
    expect(screen.getByRole('img', { name: 'Mapa ilustrativo del recorrido a Izamal del prototipo' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Recorrido del prototipo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Personalizar mi itinerario' })).toBeInTheDocument()
  })
})
