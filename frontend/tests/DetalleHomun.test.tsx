import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Layout from '../src/components/layout/Layout'
import DetalleRutaPage from '../src/features/transporte/pages/DetalleRutaPage'
import RutasPage from '../src/features/transporte/pages/RutasPage'
import ItinerarioPage from '../src/features/mi-viaje/pages/ItinerarioPage'
import PersonalizarPage from '../src/features/mi-viaje/pages/PersonalizarPage'

vi.mock('../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: null, cargando: false, cerrarSesion: vi.fn(), tieneRol: () => false }),
}))

const routers: ReturnType<typeof createMemoryRouter>[] = []
function montar(url = '/rutas/homun') {
  const router = createMemoryRouter(
    [{
      element: <Layout />,
      children: [
        { path: 'rutas', element: <RutasPage /> },
        { path: 'rutas/:id', element: <DetalleRutaPage /> },
        { path: 'rutas/:id/itinerario', element: <ItinerarioPage /> },
        { path: 'rutas/:id/personalizar', element: <PersonalizarPage /> },
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

describe('Detalle propio de Homún CU-03 / RF03', () => {
  it('abre Homún desde el catálogo con tarifa, terminal y composición propias', async () => {
    const { router } = montar('/rutas')
    await userEvent.click(screen.getByRole('link', { name: 'Ver ruta a Homún' }))
    expect(router.state.location.pathname).toBe('/rutas/homun')
    expect(screen.getByRole('heading', { name: 'Homún', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Ruta colectiva van · Anillo de Cenotes')).toBeInTheDocument()
    expect(screen.getByText('Paraíso de Cenotes y Naturaleza Maya · Yucatán')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Pasaje' })).toHaveTextContent('$38 MXN')
    expect(screen.getByRole('heading', { name: 'Terminal Parque San Juan · Calle 69' })).toBeInTheDocument()
    expect(screen.getByText('Mérida Centro')).toBeInTheDocument()
    const recorrido = screen.getByRole('region', { name: 'Mapeo de ruta y paradas' })
    expect(within(recorrido).getByText('~55 min')).toBeInTheDocument()
    expect(within(recorrido).getByText('Corredor Oriente Cenotes')).toBeInTheDocument()
    expect(within(recorrido).getByRole('img', { name: 'Mapa ilustrativo del recorrido a Homún' })).toBeInTheDocument()
    expect(within(recorrido).getByRole('list', { name: 'Recorrido ilustrativo a Homún' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Descubre Homún a tu ritmo' })).toBeInTheDocument()
    expect(screen.getByText(/Tarifa, duración y recorrido por confirmar/)).toBeInTheDocument()
  })

  it.each(['/rutas/homun', '/rutas/homun/'])('permite acceso directo a %s, con Rutas activa y cabecera única', url => {
    const { container } = montar(url)
    expect(screen.getByRole('article', { name: 'Homún' })).toBeInTheDocument()
    const navegacion = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(1)
    expect(within(navegacion).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
    expect(container.querySelector('.biin-cabecera-simple')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Volver al catálogo de rutas' })).toHaveLength(1)
  })

  it('vuelve al catálogo aunque no haya historial previo', async () => {
    const { router } = montar()
    await userEvent.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    expect(router.state.location.pathname).toBe('/rutas')
    expect(screen.getByRole('heading', { name: '¿A dónde viajaremos hoy?' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Ver ruta a / })).toHaveLength(5)
  })

  it('conserva el orden de las cinco paradas con Origen y Destino', () => {
    montar()
    const lista = screen.getByRole('list', { name: 'Recorrido ilustrativo a Homún' })
    const paradas = within(lista).getAllByRole('listitem')
    expect(paradas).toHaveLength(5)
    const nombres = ['Mérida (Parque San Juan)', 'Periférico Oriente', 'Acanceh (Entronque)', 'Cuzamá', 'Homún Centro']
    nombres.forEach((nombre, indice) => expect(paradas[indice]).toHaveTextContent(nombre))
    expect(within(lista).getByText('Origen')).toBeInTheDocument()
    expect(within(lista).getByText('Destino')).toBeInTheDocument()
    expect(paradas[4]).toHaveTextContent('Frente al Palacio Municipal')
  })

  it('usa las referencias específicas de Homún y un alt cultural neutral', () => {
    montar()
    const lugares = screen.getByRole('list', { name: 'Lugares destacados de Homún' })
    expect(within(lugares).getAllByRole('listitem')).toHaveLength(2)
    expect(within(lugares).getByText('Cenote Santa Rosa')).toBeInTheDocument()
    expect(within(lugares).getByText('Cenote Tza Ujun Kat')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Fotografía representativa de Homún pendiente de verificar' })).toHaveTextContent('Fotografía pendiente de verificación')
    expect(screen.getByRole('article', { name: 'Homún' })).not.toHaveTextContent(/Convento San Bernardino|Mercado Municipal Bazar/)
  })

  it('selecciona las tres estancias con teclado y conserva el foco', async () => {
    montar()
    const user = userEvent.setup()
    const medio = screen.getByRole('radio', { name: /Medio día/ })
    const completo = screen.getByRole('radio', { name: /Día completo/ })
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

  it('permite elegir por ratón dos días sin convertirlos en horas continuas', async () => {
    montar()
    await userEvent.click(screen.getByRole('radio', { name: /Fin de semana.*2 días/ }))
    expect(screen.getByRole('radio', { name: /Fin de semana.*2 días/ })).toBeChecked()
    expect(screen.getByRole('article', { name: 'Homún' })).not.toHaveTextContent(/48\s*(h|horas)/)
  })

  it('alterna bookmark_border y bookmark y recupera el favorito al remontar', async () => {
    const primera = montar()
    const boton = screen.getByRole('button', { name: 'Guardar Homún como favorito' })
    expect(boton).toHaveAttribute('aria-pressed', 'false')
    expect(within(boton).getByText('favorite_border')).toBeInTheDocument()
    await userEvent.click(boton)
    expect(boton).toHaveAttribute('aria-pressed', 'true')
    expect(within(boton).getByText('favorite')).toBeInTheDocument()
    primera.unmount()
    const segunda = montar()
    expect(screen.getByRole('button', { name: 'Guardar Homún como favorito' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/solo en este navegador, sin sincronización con una cuenta/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar Homún como favorito' }))
    segunda.unmount()
    montar()
    expect(screen.getByRole('button', { name: 'Guardar Homún como favorito' })).toHaveAttribute('aria-pressed', 'false')
  })

  it.each([
    ['Izamal', 'Guardar ruta favorita', 'Volver a lista de rutas'],
    ['Valladolid', 'Guardar Valladolid como favorito', 'Volver al catálogo de rutas'],
    ['Tekit', 'Guardar Tekit como favorito', 'Volver al catálogo de rutas'],
  ])('mantiene el favorito de Homún independiente del de %s', async (nombre, favoritoOtro, volverOtro) => {
    montar()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Guardar Homún como favorito' }))
    await user.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    await user.click(screen.getByRole('link', { name: `Ver ruta a ${nombre}` }))
    expect(screen.getByRole('button', { name: favoritoOtro })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: favoritoOtro }))
    await user.click(screen.getByRole('link', { name: volverOtro }))
    await user.click(screen.getByRole('link', { name: 'Ver ruta a Homún' }))
    expect(screen.getByRole('button', { name: 'Guardar Homún como favorito' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Guardar Homún como favorito' }))
    await user.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    await user.click(screen.getByRole('link', { name: `Ver ruta a ${nombre}` }))
    expect(screen.getByRole('button', { name: favoritoOtro })).toHaveAttribute('aria-pressed', 'true')
  })

  it('avisa si falla la escritura y no afirma que persistió el favorito', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    const primera = montar()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar Homún como favorito' }))
    expect(screen.getByRole('button', { name: 'Guardar Homún como favorito' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/No se pudo acceder al almacenamiento del navegador/)).toHaveAttribute('role', 'status')
    expect(screen.getByText(/solo durará mientras esta página esté abierta/)).toBeInTheDocument()
    primera.unmount()
    montar()
    expect(screen.getByRole('button', { name: 'Guardar Homún como favorito' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('tolera lecturas bloqueadas sin impedir consultar Homún', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    montar()
    expect(screen.getByRole('heading', { name: 'Homún', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/No se pudo acceder al almacenamiento del navegador/)).toBeInTheDocument()
  })

  it('mantiene información y selección si fallan las imágenes originales', () => {
    montar()
    fireEvent.error(screen.getByRole('img', { name: 'Mapa ilustrativo del recorrido a Homún' }))
    fireEvent.error(screen.getByRole('img', { name: 'Mapa ilustrativo del recorrido a Homún' }))
    expect(screen.getAllByText('Imagen no disponible')).toHaveLength(1)
    expect(screen.getByRole('img', { name: 'Fotografía representativa de Homún pendiente de verificar' })).toHaveTextContent('Fotografía pendiente de verificación')
    expect(screen.getByRole('list', { name: 'Recorrido ilustrativo a Homún' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Fin de semana/ })).toBeInTheDocument()
  })

  it.each([['Medio día', 'medio-dia', 270], ['Día completo', 'dia-completo', 540], ['Fin de semana', 'fin-de-semana', 540]] as const)('abre el planificador desde %s conservando estancia y retorno', async (nombre, estancia, minutos) => {
    const { router } = montar()
    await userEvent.click(screen.getByRole('radio', { name: new RegExp(nombre) }))
    await userEvent.click(screen.getByRole('button', { name: 'Itinerario recomendado en Homún' }))
    expect(router.state.location.pathname).toBe('/rutas/homun/itinerario')
    expect(screen.getByLabelText('Estancia')).toHaveValue(estancia)
    expect(screen.getByLabelText('Horas del Día 1')).toHaveValue(minutos === null ? null : Math.floor(minutos / 60))
    expect(screen.getByLabelText('Minutos del Día 1')).toHaveValue(minutos === null ? null : minutos % 60)
    if (estancia === 'fin-de-semana') expect(screen.getByLabelText('Horas del Día 2')).toHaveValue(9)
    if (estancia === 'fin-de-semana') expect(screen.getByLabelText('Minutos del Día 2')).toHaveValue(0)
    expect(screen.queryByRole('heading', { name: 'Paso a paso en mototaxi y a pie' })).not.toBeInTheDocument()
    expect(localStorage.length).toBe(0)
    expect(screen.queryByRole('heading', { name: 'Tu Itinerario en Izamal' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Personalizar' }))
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByLabelText('Estancia')).toHaveValue(estancia)
    await userEvent.click(screen.getByRole('link', { name: 'Volver a detalle de ruta' }))
    expect(screen.getByRole('radio', { name: new RegExp(nombre) })).toBeChecked()
  })

  it('no afirma horarios, disponibilidad, distancia ni ubicación en tiempo real', () => {
    montar()
    const detalle = screen.getByRole('article', { name: 'Homún' })
    const disponibilidad = screen.getByRole('region', { name: 'Disponibilidad' })
    expect(within(disponibilidad).getByText('Sin confirmar')).toBeInTheDocument()
    expect(within(disponibilidad).getByText('Sin reporte vigente')).toBeInTheDocument()
    expect(screen.getByText('Salida · Sin confirmar')).toBeInTheDocument()
    expect(screen.getByText('Origen')).toBeInTheDocument()
    expect(detalle).not.toHaveTextContent(/próxima salida|8\s+disponibles|unidad\s*11|A\/C|estás aquí|09:00|09:15|09:35|09:48|09:55|54[.,]2\s*km|ubicación GPS/i)
  })

  it.each([['izamal', 'Izamal', 'izamal-detalle'], ['valladolid', 'Valladolid', 'izamal-detalle'], ['tekit', 'Tekit', 'izamal-detalle']])('conserva el detalle aprobado de %s', (id, nombre, clase) => {
    montar(`/rutas/${id}`)
    expect(screen.getByRole('article', { name: nombre })).toHaveClass(clase)
    expect(screen.getByRole('heading', { name: `Descubre ${nombre} a tu ritmo` })).toBeInTheDocument()
  })

  it('conserva la ruta desconocida y su enlace al catálogo', async () => {
    const { router } = montar('/rutas/no-existe')
    expect(screen.getByRole('heading', { name: 'Ruta no encontrada' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    expect(router.state.location.pathname).toBe('/rutas')
    expect(screen.getByRole('link', { name: 'Ver ruta a Homún' })).toBeInTheDocument()
  })
})
