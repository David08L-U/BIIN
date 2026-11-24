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

function montar(url = '/rutas/valladolid') {
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

describe('Detalle de Valladolid CU-03 / RF03', () => {
  it('abre Valladolid desde el catálogo con sus secciones y datos propios', async () => {
    const { router } = montar('/rutas')
    await userEvent.click(screen.getByRole('link', { name: 'Ver ruta a Valladolid' }))

    expect(router.state.location.pathname).toBe('/rutas/valladolid')
    expect(screen.getByRole('heading', { name: 'Valladolid', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Ruta intermunicipal · Pueblo Mágico Heroico')).toBeInTheDocument()
    expect(screen.getByText('La Sultana del Oriente · Yucatán')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Tarifa' })).getByText('$120 MXN')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Terminal Noreste · Calle 50 x 67' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mapeo de ruta y paradas' })).toBeInTheDocument()
    expect(screen.getByText('~2 h 10 min')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Descubre Valladolid a tu ritmo' })).toBeInTheDocument()
    for (const lugar of ['Convento San Bernardino', 'Cenote Zací', 'Calzada de los Frailes', 'Mercado Municipal Bazar']) {
      expect(screen.getByText(lugar, { exact: true })).toBeInTheDocument()
    }
    expect(screen.getByText(/Datos del prototipo, pendientes de validar y sin fecha de validación/)).toBeInTheDocument()
  })

  it.each(['/rutas/valladolid', '/rutas/valladolid/'])('permite acceso directo a %s sin cabeceras duplicadas', url => {
    const { container } = montar(url)
    expect(screen.getByRole('article', { name: 'Valladolid' })).toBeInTheDocument()
    const navegacion = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(1)
    expect(within(navegacion).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
    expect(container.querySelector('.biin-cabecera-simple')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Volver al catálogo de rutas' })).toHaveLength(1)
  })

  it('vuelve al catálogo incluso sin una entrada previa en el historial', async () => {
    const { router } = montar()
    await userEvent.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    expect(router.state.location.pathname).toBe('/rutas')
    expect(screen.getByRole('heading', { name: '¿A dónde viajaremos hoy?' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Ver ruta a / })).toHaveLength(5)
  })

  it('muestra el recorrido de Valladolid en el orden del prototipo', () => {
    montar()
    const lista = screen.getByRole('list', { name: 'Recorrido del prototipo a Valladolid' })
    const paradas = within(lista).getAllByRole('listitem')
    expect(paradas).toHaveLength(5)
    const nombres = ['Mérida (Terminal Noreste)', 'Kanasín / Entronque Cancún', 'Kantunil', 'Pisté / Chichén Itzá', 'Valladolid Centro']
    nombres.forEach((nombre, indice) => expect(paradas[indice]).toHaveTextContent(nombre))
    expect(within(lista).getByText('Origen')).toBeInTheDocument()
    expect(within(lista).getByText('Destino')).toBeInTheDocument()
  })

  it('permite seleccionar las tres estancias con teclado y conserva el foco', async () => {
    montar()
    const user = userEvent.setup()
    const medio = screen.getByRole('radio', { name: /Medio día.*4–5 horas/ })
    const completo = screen.getByRole('radio', { name: /Día completo.*8–10 horas/ })
    const fin = screen.getByRole('radio', { name: /Fin de semana.*2 días/ })
    expect(screen.getByRole('group', { name: 'Tiempo disponible estimado' })).toBeInTheDocument()
    expect(medio).toBeChecked()
    medio.focus()
    await user.keyboard('{ArrowRight}')
    expect(completo).toBeChecked()
    expect(completo).toHaveFocus()
    expect(medio).not.toBeChecked()
    await user.keyboard('{ArrowRight}')
    expect(fin).toBeChecked()
    expect(fin).toHaveFocus()
    expect(completo).not.toBeChecked()
    await user.keyboard('{ArrowRight}')
    expect(medio).toBeChecked()
    expect(medio).toHaveFocus()
    expect(fin).not.toBeChecked()
  })

  it('permite seleccionar por ratón sin convertir el fin de semana en horas continuas', async () => {
    montar()
    await userEvent.click(screen.getByRole('radio', { name: /Fin de semana/ }))
    expect(screen.getByRole('radio', { name: /Fin de semana.*2 días/ })).toBeChecked()
    expect(screen.getByRole('article', { name: 'Valladolid' })).not.toHaveTextContent(/48\s*(h|horas)/)
  })

  it('persiste el favorito de Valladolid independientemente del de Izamal', async () => {
    const primera = montar()
    const user = userEvent.setup()
    const favoritoValladolid = () => screen.getByRole('button', { name: 'Guardar Valladolid como favorito' })
    expect(favoritoValladolid()).toHaveAttribute('aria-pressed', 'false')
    await user.click(favoritoValladolid())
    expect(favoritoValladolid()).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    await user.click(screen.getByRole('link', { name: 'Ver ruta a Izamal' }))
    expect(screen.getByRole('button', { name: 'Guardar ruta favorita' })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'Guardar ruta favorita' }))
    await user.click(screen.getByRole('link', { name: 'Volver a lista de rutas' }))
    await user.click(screen.getByRole('link', { name: 'Ver ruta a Valladolid' }))
    expect(favoritoValladolid()).toHaveAttribute('aria-pressed', 'true')
    await user.click(favoritoValladolid())
    expect(favoritoValladolid()).toHaveAttribute('aria-pressed', 'false')
    primera.unmount()

    const segunda = montar()
    expect(favoritoValladolid()).toHaveAttribute('aria-pressed', 'false')
    segunda.unmount()
    montar('/rutas/izamal')
    expect(screen.getByRole('button', { name: 'Guardar ruta favorita' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('recupera el favorito de Valladolid al abrir de nuevo la dirección', async () => {
    const primera = montar()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar Valladolid como favorito' }))
    primera.unmount()
    montar()
    expect(screen.getByRole('button', { name: 'Guardar Valladolid como favorito' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/solo en este navegador, sin sincronización con una cuenta/)).toBeInTheDocument()
  })

  it('informa de fallos de escritura sin afirmar que persistió el favorito', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    const primera = montar()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar Valladolid como favorito' }))
    expect(screen.getByRole('button', { name: 'Guardar Valladolid como favorito' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/No se pudo acceder al almacenamiento del navegador/)).toHaveAttribute('role', 'status')
    expect(screen.getByText(/solo durará mientras esta página esté abierta/)).toBeInTheDocument()
    primera.unmount()
    montar()
    expect(screen.getByRole('button', { name: 'Guardar Valladolid como favorito' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('tolera lecturas de almacenamiento bloqueadas', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    montar()
    expect(screen.getByRole('heading', { name: 'Valladolid', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar Valladolid como favorito' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/No se pudo acceder al almacenamiento del navegador/)).toBeInTheDocument()
  })

  it('conserva la información y los controles cuando fallan las imágenes originales', () => {
    montar()
    fireEvent.error(screen.getByRole('img', { name: 'Mapa ilustrativo de Mérida a Valladolid del prototipo' }))
    fireEvent.error(screen.getByRole('img', { name: 'Convento San Bernardino de Valladolid, imagen cultural del prototipo' }))
    expect(screen.getAllByText('Imagen del prototipo no disponible')).toHaveLength(2)
    expect(screen.getByRole('img', { name: 'Mapa ilustrativo de Mérida a Valladolid del prototipo' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Recorrido del prototipo a Valladolid' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hacer mi itinerario en Valladolid' })).toBeInTheDocument()
  })

  it('anuncia el planificador pendiente sin navegar, generar ni guardar y conserva la estancia', async () => {
    const { router } = montar()
    await userEvent.click(screen.getByRole('radio', { name: /Fin de semana/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Hacer mi itinerario en Valladolid' }))
    expect(screen.getByText(/El planificador de Valladolid todavía no está disponible/)).toHaveAttribute('role', 'status')
    expect(screen.getByText(/No se ha creado ni guardado ningún itinerario/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Fin de semana.*2 días/ })).toBeChecked()
    expect(router.state.location.pathname).toBe('/rutas/valladolid')
    expect(localStorage.length).toBe(0)
    expect(screen.queryByRole('heading', { name: 'Tu Itinerario en Izamal' })).not.toBeInTheDocument()
  })

  it('no afirma disponibilidad, ubicación, horarios ni andén en tiempo real', () => {
    montar()
    const detalle = screen.getByRole('article', { name: 'Valladolid' })
    const disponibilidad = screen.getByRole('region', { name: 'Disponibilidad' })
    expect(within(disponibilidad).getByText('Sin confirmar')).toBeInTheDocument()
    expect(within(disponibilidad).getByText('Sin reporte vigente')).toBeInTheDocument()
    expect(screen.getByText('Salida · Sin confirmar')).toBeInTheDocument()
    expect(screen.getByText('Origen')).toBeInTheDocument()
    expect(screen.getByText('Distancia sin validar')).toBeInTheDocument()
    expect(detalle).not.toHaveTextContent(/próxima salida|12\s+disponibles|unidad\s*08|estás aquí|08:30|08:50|09:30|10:15|10:40|andén 4|159 km/i)
  })

  it('mantiene el detalle aprobado de Izamal y sus acciones', () => {
    montar('/rutas/izamal')
    expect(screen.getByRole('article', { name: 'Izamal' })).toHaveClass('izamal-detalle')
    expect(screen.getByRole('heading', { name: 'Descubre Izamal a tu ritmo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Itinerario recomendado en Izamal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Personalizar mi itinerario' })).toBeInTheDocument()
  })

  it('conserva el estado de ruta desconocida y su regreso al catálogo', async () => {
    const { router } = montar('/rutas/desconocida')
    expect(screen.getByRole('heading', { name: 'Ruta no encontrada' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    expect(router.state.location.pathname).toBe('/rutas')
    expect(screen.getByRole('link', { name: 'Ver ruta a Valladolid' })).toBeInTheDocument()
  })
})
