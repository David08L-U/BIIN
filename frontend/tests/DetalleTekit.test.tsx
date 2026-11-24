import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Layout from '../src/components/layout/Layout'
import DetalleRutaPage from '../src/features/transporte/pages/DetalleRutaPage'
import RutasPage from '../src/features/transporte/pages/RutasPage'

vi.mock('../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: null, cargando: false, cerrarSesion: vi.fn(), tieneRol: () => false }),
}))

const routers: ReturnType<typeof createMemoryRouter>[] = []

function montar(url = '/rutas/tekit') {
  const router = createMemoryRouter(
    [{
      element: <Layout />,
      children: [
        { path: 'rutas', element: <RutasPage /> },
        { path: 'rutas/:id', element: <DetalleRutaPage /> },
      ],
    }],
    { initialEntries: [url] },
  )
  routers.push(router)
  return { router, ...render(<RouterProvider router={router} />) }
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.restoreAllMocks()
  routers.splice(0).forEach(router => router.dispose())
})

describe('Detalle propio de Tekit CU-03 / RF03', () => {
  it('abre desde el catálogo con sus métricas, terminal y tarjeta textil', async () => {
    const { router } = montar('/rutas')
    await userEvent.click(screen.getByRole('link', { name: 'Ver ruta a Tekit' }))
    expect(router.state.location.pathname).toBe('/rutas/tekit')
    expect(screen.getByRole('heading', { name: 'Tekit', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Ruta colectiva van · Capital de la Guayabera')).toBeInTheDocument()
    expect(screen.getByText('Villa de Guayaberas y Tradición Textil · Yucatán')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Tarifa' })).getByText('$45 MXN')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Terminal Parque San Juan · Calle 69' })).toBeInTheDocument()
    expect(screen.getByText('Mérida Centro, entre 62 y 64')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mapeo de ruta y paradas' })).toBeInTheDocument()
    expect(screen.getByText('Tiempo estimado de viaje · ~1 h 05 min')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Descubre Tekit a tu ritmo' })).toBeInTheDocument()
    expect(screen.getByText('Ruta Textil · Talleres de Bordado · Gastronomía Local')).toBeInTheDocument()
    const lugares = screen.getByRole('list', { name: 'Lugares destacados del prototipo' })
    for (const nombre of ['Talleres de Guayaberas', 'Parroquia San Antonio', 'Cenote Bekal', 'Panaderías Tradicionales']) {
      expect(within(lugares).getByText(nombre)).toBeInTheDocument()
    }
    expect(screen.getByText(/Datos del prototipo, pendientes de validar y sin fecha de validación/)).toBeInTheDocument()
  })

  it.each(['/rutas/tekit', '/rutas/tekit/'])('abre directamente %s con Rutas activa y sin cabecera duplicada', url => {
    const { container } = montar(url)
    expect(screen.getByRole('article', { name: 'Tekit' })).toBeInTheDocument()
    const navegacion = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(1)
    expect(within(navegacion).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
    expect(container.querySelector('.biin-cabecera-simple')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Volver al catálogo de rutas' })).toHaveLength(1)
  })

  it('vuelve al catálogo sin depender del historial anterior', async () => {
    const { router } = montar()
    await userEvent.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    expect(router.state.location.pathname).toBe('/rutas')
    expect(screen.getByRole('heading', { name: '¿A dónde viajaremos hoy?' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Ver ruta a / })).toHaveLength(5)
  })

  it('conserva las cinco paradas del recorrido de Tekit en orden', () => {
    montar()
    const lista = screen.getByRole('list', { name: 'Recorrido del prototipo a Tekit' })
    const paradas = within(lista).getAllByRole('listitem')
    expect(paradas).toHaveLength(5)
    const nombres = ['Mérida (Parque San Juan)', 'Periférico Sur / Kanasín', 'Acanceh Centro', 'Tecoh', 'Tekit Centro']
    nombres.forEach((nombre, indice) => expect(paradas[indice]).toHaveTextContent(nombre))
    expect(within(lista).getByText('Origen')).toBeInTheDocument()
    expect(within(lista).getByText('Destino')).toBeInTheDocument()
  })

  it('selecciona las tres opciones con teclado y mantiene el foco', async () => {
    montar()
    const user = userEvent.setup()
    const medio = screen.getByRole('radio', { name: /Medio día.*3–4 horas/ })
    const completo = screen.getByRole('radio', { name: /Día completo.*6 horas/ })
    const textil = screen.getByRole('radio', { name: /Ruta Textil.*Compras/ })
    expect(screen.getByRole('group', { name: 'Estancia o modalidad de visita' })).toBeInTheDocument()
    expect(medio).toBeChecked()
    medio.focus()
    await user.keyboard('{ArrowRight}')
    expect(completo).toBeChecked()
    expect(completo).toHaveFocus()
    expect(medio).not.toBeChecked()
    await user.keyboard('{ArrowRight}')
    expect(textil).toBeChecked()
    expect(textil).toHaveFocus()
    expect(completo).not.toBeChecked()
    await user.keyboard('{ArrowRight}')
    expect(medio).toBeChecked()
    expect(medio).toHaveFocus()
    expect(textil).not.toBeChecked()
  })

  it('permite elegir Compras por ratón como modalidad sin horas inventadas', async () => {
    montar()
    await userEvent.click(screen.getByRole('radio', { name: /Ruta Textil.*Compras/ }))
    expect(screen.getByRole('radio', { name: /Ruta Textil.*Compras/ })).toBeChecked()
    const grupo = screen.getByRole('group', { name: 'Estancia o modalidad de visita' })
    expect(within(grupo).getByText('Compras')).toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it('mantiene el favorito independiente de Izamal y Valladolid al navegar entre destinos', async () => {
    const primera = montar()
    const user = userEvent.setup()
    const favoritoTekit = () => screen.getByRole('button', { name: 'Guardar Tekit como favorito' })
    expect(favoritoTekit()).toHaveAttribute('aria-pressed', 'false')
    await user.click(favoritoTekit())
    await user.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    await user.click(screen.getByRole('link', { name: 'Ver ruta a Izamal' }))
    expect(screen.getByRole('button', { name: 'Guardar ruta favorita' })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'Guardar ruta favorita' }))
    await user.click(screen.getByRole('link', { name: 'Volver a lista de rutas' }))
    await user.click(screen.getByRole('link', { name: 'Ver ruta a Valladolid' }))
    expect(screen.getByRole('button', { name: 'Guardar Valladolid como favorito' })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'Guardar Valladolid como favorito' }))
    await user.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    await user.click(screen.getByRole('link', { name: 'Ver ruta a Tekit' }))
    expect(favoritoTekit()).toHaveAttribute('aria-pressed', 'true')
    await user.click(favoritoTekit())
    primera.unmount()

    const segunda = montar('/rutas/izamal')
    expect(screen.getByRole('button', { name: 'Guardar ruta favorita' })).toHaveAttribute('aria-pressed', 'true')
    segunda.unmount()
    const tercera = montar('/rutas/valladolid')
    expect(screen.getByRole('button', { name: 'Guardar Valladolid como favorito' })).toHaveAttribute('aria-pressed', 'true')
    tercera.unmount()
    montar()
    expect(favoritoTekit()).toHaveAttribute('aria-pressed', 'false')
  })

  it('recupera el favorito de Tekit al abrir de nuevo la dirección', async () => {
    const primera = montar()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar Tekit como favorito' }))
    primera.unmount()
    montar()
    expect(screen.getByRole('button', { name: 'Guardar Tekit como favorito' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/solo en este navegador, sin sincronización con una cuenta/)).toBeInTheDocument()
  })

  it('avisa si la escritura del favorito falla y no afirma persistencia', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    const primera = montar()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar Tekit como favorito' }))
    expect(screen.getByRole('button', { name: 'Guardar Tekit como favorito' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/No se pudo acceder al almacenamiento del navegador/)).toHaveAttribute('role', 'status')
    expect(screen.getByText(/solo durará mientras esta página esté abierta/)).toBeInTheDocument()
    primera.unmount()
    montar()
    expect(screen.getByRole('button', { name: 'Guardar Tekit como favorito' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('tolera lecturas bloqueadas sin impedir consultar el detalle', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    montar()
    expect(screen.getByRole('heading', { name: 'Tekit', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/No se pudo acceder al almacenamiento del navegador/)).toBeInTheDocument()
  })

  it('mantiene recorrido y controles cuando fallan las imágenes originales', () => {
    montar()
    fireEvent.error(screen.getByRole('img', { name: 'Mapa ilustrativo del recorrido a Tekit del prototipo' }))
    fireEvent.error(screen.getByRole('img', { name: 'Taller textil de guayaberas de Tekit, imagen cultural del prototipo' }))
    expect(screen.getAllByText('Imagen del prototipo no disponible')).toHaveLength(2)
    expect(screen.getByRole('img', { name: 'Mapa ilustrativo del recorrido a Tekit del prototipo' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Recorrido del prototipo a Tekit' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Ruta Textil.*Compras/ })).toBeInTheDocument()
  })

  it('anuncia el planificador pendiente conservando la modalidad sin navegar ni guardar', async () => {
    const { router } = montar()
    await userEvent.click(screen.getByRole('radio', { name: /Ruta Textil.*Compras/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Hacer mi itinerario en Tekit' }))
    expect(screen.getByText(/El planificador de Tekit todavía no está disponible/)).toHaveAttribute('role', 'status')
    expect(screen.getByText(/No se ha creado ni guardado ningún itinerario/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Ruta Textil.*Compras/ })).toBeChecked()
    expect(router.state.location.pathname).toBe('/rutas/tekit')
    expect(localStorage.length).toBe(0)
    expect(screen.queryByRole('heading', { name: 'Tu Itinerario en Izamal' })).not.toBeInTheDocument()
  })

  it('abre y cierra la referencia de terminal con teclado, sin simular GPS', async () => {
    montar()
    const boton = screen.getByRole('button', { name: 'Ver referencia de salida de Tekit' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', { name: 'Referencia de salida de Tekit' })).not.toBeInTheDocument()
    boton.focus()
    await userEvent.keyboard('{Enter}')
    expect(boton).toHaveAttribute('aria-expanded', 'true')
    const referencia = screen.getByRole('region', { name: 'Referencia de salida de Tekit' })
    expect(referencia).toHaveTextContent('Terminal Parque San Juan · Calle 69')
    expect(referencia).toHaveTextContent('No representa tu ubicación ni ofrece indicaciones GPS.')
    await userEvent.keyboard('{Enter}')
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(boton).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'Referencia de salida de Tekit' })).not.toBeInTheDocument()
  })

  it('no afirma salida, disponibilidad, ubicación, distancias ni medios de pago reales', () => {
    montar()
    const detalle = screen.getByRole('article', { name: 'Tekit' })
    const disponibilidad = screen.getByRole('region', { name: 'Disponibilidad' })
    expect(within(disponibilidad).getByText('Sin confirmar')).toBeInTheDocument()
    expect(within(disponibilidad).getByText('Sin reporte vigente')).toBeInTheDocument()
    expect(screen.getByText('Salida · Sin confirmar')).toBeInTheDocument()
    expect(screen.getByText('Origen')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Tarifa' })).getByText('Por validar')).toBeInTheDocument()
    expect(detalle).not.toHaveTextContent(/próxima salida|9\s+disponibles|aire acondicionado|A\/C|estás aquí|09:15|09:30|09:50|10:05|10:20|68\s*km|efectivo/i)
  })

  it.each([['izamal', 'Izamal', 'izamal-detalle'], ['valladolid', 'Valladolid', 'valladolid-detalle']])('conserva el detalle aprobado de %s', (id, nombre, clase) => {
    montar(`/rutas/${id}`)
    expect(screen.getByRole('article', { name: nombre })).toHaveClass(clase)
    expect(screen.getByRole('heading', { name: `Descubre ${nombre} a tu ritmo` })).toBeInTheDocument()
  })

  it('conserva el estado de ruta desconocida y permite volver al catálogo', async () => {
    const { router } = montar('/rutas/no-existe')
    expect(screen.getByRole('heading', { name: 'Ruta no encontrada' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    expect(router.state.location.pathname).toBe('/rutas')
    expect(screen.getByRole('link', { name: 'Ver ruta a Tekit' })).toBeInTheDocument()
  })
})
