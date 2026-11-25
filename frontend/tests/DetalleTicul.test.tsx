import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Layout from '../src/components/layout/Layout'
import DetalleRutaPage from '../src/features/transporte/pages/DetalleRutaPage'
import RutasPage from '../src/features/transporte/pages/RutasPage'
import ItinerarioTiculPage from '../src/features/mi-viaje/pages/ItinerarioTiculPage'
import PersonalizarTiculPage from '../src/features/mi-viaje/pages/PersonalizarTiculPage'

vi.mock('../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: null, cargando: false, cerrarSesion: vi.fn(), tieneRol: () => false }),
}))

const routers: ReturnType<typeof createMemoryRouter>[] = []
function montar(url = '/rutas/ticul') {
  const router = createMemoryRouter(
    [{
      element: <Layout />,
      children: [
        { path: 'rutas', element: <RutasPage /> },
        { path: 'rutas/:id', element: <DetalleRutaPage /> },
        { path: 'rutas/ticul/itinerario', element: <ItinerarioTiculPage /> },
        { path: 'rutas/ticul/personalizar', element: <PersonalizarTiculPage /> },
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

describe('Detalle propio de Ticul CU-03 / RF03', () => {
  it('abre Ticul desde el catálogo con su tarifa y composición propias', async () => {
    const { router } = montar('/rutas')
    await userEvent.click(screen.getByRole('link', { name: 'Ver ruta a Ticul' }))
    expect(router.state.location.pathname).toBe('/rutas/ticul')
    expect(screen.getByRole('heading', { name: 'Ticul', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Ruta intermunicipal · La Perla del Sur')).toBeInTheDocument()
    expect(screen.getByText('Cuna del Calzado Artesanal y la Alfarería Maya · Yucatán')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tarifa por pasaje' })).toHaveTextContent('$60 MXN')
    expect(screen.getByRole('region', { name: 'Terminal Parque San Juan · Calle 69' })).toHaveTextContent('Mérida Centro')
    const recorrido = screen.getByRole('region', { name: 'Mapeo de ruta y paradas' })
    expect(within(recorrido).getByText('Duración aproximada · ~1 h 30 min')).toBeInTheDocument()
    expect(within(recorrido).getByText('Ruta Puuc Sur')).toBeInTheDocument()
    expect(within(recorrido).getByText('Carretera Federal 261')).toBeInTheDocument()
    expect(within(recorrido).getByText(/Mapa ilustrativo · Sin verificar/)).toBeInTheDocument()
    expect(within(recorrido).getByText(/Sin verificar/)).toBeInTheDocument()
    expect(screen.getByText('Top Destino del Sur')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Descubre Ticul a tu ritmo' })).toBeInTheDocument()
    expect(screen.getByText('Barrio Alfarero de San Enrique · Calzado Fino · Ruta Puuc')).toBeInTheDocument()
    expect(screen.getByText(/Tarifa, duración, recorrido y referencias del prototipo: pendientes de validar, sin fecha de validación/)).toBeInTheDocument()
  })

  it.each(['/rutas/ticul', '/rutas/ticul/'])('permite acceso directo a %s con Rutas activa y una sola cabecera', url => {
    const { container } = montar(url)
    expect(screen.getByRole('article', { name: 'Ticul' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(1)
    const navegacion = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(navegacion).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
    expect(container.querySelector('.biin-cabecera-simple')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Volver al catálogo de rutas' })).toHaveLength(1)
  })

  it('regresa al catálogo sin necesitar historial anterior', async () => {
    const { router } = montar()
    await userEvent.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    expect(router.state.location.pathname).toBe('/rutas')
    expect(screen.getByRole('heading', { name: '¿A dónde viajaremos hoy?' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Ver ruta a / })).toHaveLength(5)
  })

  it('conserva el orden y las referencias de las cinco paradas del prototipo', () => {
    montar()
    const lista = screen.getByRole('list', { name: 'Recorrido del prototipo a Ticul' })
    const paradas = within(lista).getAllByRole('listitem')
    const nombres = ['Mérida (Parque San Juan)', 'Umán / Entronque Carretera', 'Muna Centro', 'Entronque San José Tipceh', 'Ticul Centro']
    expect(paradas).toHaveLength(5)
    nombres.forEach((nombre, indice) => expect(paradas[indice]).toHaveTextContent(nombre))
    expect(within(lista).getByText('Origen')).toBeInTheDocument()
    expect(within(lista).getByText('Destino')).toBeInTheDocument()
    expect(paradas[4]).toHaveTextContent('Frente al Mercado Municipal y Plaza de Armas')
    const lugares = screen.getByRole('list', { name: 'Lugares destacados de Ticul' })
    expect(within(lugares).getAllByRole('listitem')).toHaveLength(4)
    for (const nombre of ['Corredor del Calzado', 'Talleres de Alfarería', 'Iglesia de San Antonio', 'Mercado Municipal']) {
      expect(within(lugares).getByText(nombre)).toBeInTheDocument()
    }
  })

  it('selecciona las tres opciones con flechas y mantiene el foco en el radio elegido', async () => {
    montar()
    const user = userEvent.setup()
    const medio = screen.getByRole('radio', { name: 'Medio día (3–4 horas)' })
    const completo = screen.getByRole('radio', { name: 'Día completo (Ruta Puuc)' })
    const compras = screen.getByRole('radio', { name: 'Tour de Compras' })
    expect(screen.getByRole('group', { name: 'Estancia o modalidad' })).toBeInTheDocument()
    expect(medio).toBeChecked()
    medio.focus()
    await user.keyboard('{ArrowRight}')
    expect(completo).toBeChecked()
    expect(completo).toHaveFocus()
    expect(medio).not.toBeChecked()
    await user.keyboard('{ArrowRight}')
    expect(compras).toBeChecked()
    expect(compras).toHaveFocus()
    expect(completo).not.toBeChecked()
    await user.keyboard('{ArrowRight}')
    expect(medio).toBeChecked()
    expect(medio).toHaveFocus()
    expect(compras).not.toBeChecked()
  })

  it('permite elegir modalidades por ratón sin asignarles horas inventadas', async () => {
    montar()
    const completo = screen.getByRole('radio', { name: 'Día completo (Ruta Puuc)' })
    const compras = screen.getByRole('radio', { name: 'Tour de Compras' })
    await userEvent.click(completo)
    expect(completo).toBeChecked()
    await userEvent.click(compras)
    expect(compras).toBeChecked()
    expect(completo).not.toBeChecked()
    expect(screen.getByRole('group', { name: 'Estancia o modalidad' })).not.toHaveTextContent(/6\s*horas|8\s*horas|48\s*horas/)
  })

  it('alterna el corazón y recupera tanto el favorito como su eliminación al remontar', async () => {
    const primera = montar()
    const boton = screen.getByRole('button', { name: 'Guardar Ticul como favorito' })
    expect(boton).toHaveAttribute('aria-pressed', 'false')
    expect(within(boton).getByText('favorite_border')).toBeInTheDocument()
    await userEvent.click(boton)
    expect(boton).toHaveAttribute('aria-pressed', 'true')
    expect(within(boton).getByText('favorite')).toBeInTheDocument()
    expect(localStorage.getItem('biin:favorito-ruta:ticul')).toBe('true')
    primera.unmount()
    const segunda = montar()
    expect(screen.getByRole('button', { name: 'Guardar Ticul como favorito' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/solo en este navegador, sin sincronización con una cuenta/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar Ticul como favorito' }))
    segunda.unmount()
    montar()
    expect(screen.getByRole('button', { name: 'Guardar Ticul como favorito' })).toHaveAttribute('aria-pressed', 'false')
  })

  it.each([
    ['Izamal', 'Guardar ruta favorita', 'Volver a lista de rutas'],
    ['Valladolid', 'Guardar Valladolid como favorito', 'Volver al catálogo de rutas'],
    ['Tekit', 'Guardar Tekit como favorito', 'Volver al catálogo de rutas'],
    ['Homún', 'Guardar Homún como favorito', 'Volver al catálogo de rutas'],
  ])('mantiene el favorito de Ticul independiente del de %s', async (nombre, favoritoOtro, volverOtro) => {
    montar()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Guardar Ticul como favorito' }))
    await user.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    await user.click(screen.getByRole('link', { name: `Ver ruta a ${nombre}` }))
    expect(screen.getByRole('button', { name: favoritoOtro })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: favoritoOtro }))
    await user.click(screen.getByRole('link', { name: volverOtro }))
    await user.click(screen.getByRole('link', { name: 'Ver ruta a Ticul' }))
    expect(screen.getByRole('button', { name: 'Guardar Ticul como favorito' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Guardar Ticul como favorito' }))
    await user.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    await user.click(screen.getByRole('link', { name: `Ver ruta a ${nombre}` }))
    expect(screen.getByRole('button', { name: favoritoOtro })).toHaveAttribute('aria-pressed', 'true')
  })

  it('avisa si no puede guardar el favorito y no afirma que se haya persistido', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    const primera = montar()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar Ticul como favorito' }))
    expect(screen.getByRole('button', { name: 'Guardar Ticul como favorito' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/No se pudo acceder al almacenamiento del navegador/)).toHaveAttribute('role', 'status')
    expect(screen.getByText(/solo durará mientras esta página esté abierta/)).toBeInTheDocument()
    primera.unmount()
    montar()
    expect(screen.getByRole('button', { name: 'Guardar Ticul como favorito' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('tolera lecturas bloqueadas sin impedir consultar el detalle', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    montar()
    expect(screen.getByRole('heading', { name: 'Ticul', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/No se pudo acceder al almacenamiento del navegador/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Tour de Compras' })).toBeInTheDocument()
  })

  it('conserva imágenes alternativas, recorrido y selección al fallar las imágenes originales', async () => {
    montar()
    await userEvent.click(screen.getByRole('radio', { name: 'Tour de Compras' }))
    fireEvent.error(screen.getByRole('img', { name: 'Mapa ilustrativo del recorrido a Ticul del prototipo' }))
    fireEvent.error(screen.getByRole('img', { name: 'Imagen de artesanía y taller del prototipo para Ticul' }))
    expect(screen.getAllByText('Imagen del prototipo no disponible')).toHaveLength(2)
    expect(screen.getByRole('img', { name: 'Mapa ilustrativo del recorrido a Ticul del prototipo' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Imagen de artesanía y taller del prototipo para Ticul' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Recorrido del prototipo a Ticul' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Descubre Ticul a tu ritmo' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Tour de Compras' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Itinerario recomendado en Ticul' })).toBeInTheDocument()
  })

  it.each([['Medio día (3–4 horas)', 'medio-dia', 240], ['Día completo (Ruta Puuc)', 'dia-completo', null], ['Tour de Compras', 'tour-compras', null]] as const)('abre el planificador desde %s conservando modalidad y retorno', async (opcion, modalidad, minutos) => {
    const { router } = montar()
    await userEvent.click(screen.getByRole('radio', { name: opcion }))
    await userEvent.click(screen.getByRole('button', { name: 'Itinerario recomendado en Ticul' }))
    expect(router.state.location.pathname).toBe('/rutas/ticul/itinerario')
    expect(screen.getByLabelText('Estancia o modalidad')).toHaveValue(modalidad)
    expect(screen.getByLabelText('Tiempo disponible (minutos)')).toHaveValue(minutos)
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie & mototaxi' })).not.toBeInTheDocument()
    expect(localStorage.length).toBe(0)
    expect(screen.queryByRole('heading', { name: 'Tu Itinerario en Izamal' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Personalizar' }))
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByLabelText('Estancia o modalidad')).toHaveValue(modalidad)
    await userEvent.click(screen.getByRole('link', { name: 'Volver a detalle de ruta' }))
    expect(screen.getByRole('radio', { name: opcion })).toBeChecked()
  })

  it('no afirma GPS, tráfico, horarios, medios de pago ni disponibilidad en tiempo real', () => {
    montar()
    const detalle = screen.getByRole('article', { name: 'Ticul' })
    const disponibilidad = screen.getByRole('region', { name: 'Disponibilidad' })
    expect(within(disponibilidad).getByText('Sin confirmar')).toBeInTheDocument()
    expect(within(disponibilidad).getByText('Sin reporte vigente')).toBeInTheDocument()
    expect(screen.getByText('Salida · Sin confirmar')).toBeInTheDocument()
    expect(screen.getByText('Medios de pago sin confirmar')).toBeInTheDocument()
    expect(screen.getByText('Origen')).toBeInTheDocument()
    expect(detalle).not.toHaveTextContent(/próxima salida|10\s+(asientos|disponibles)|unidad\s*07|A\/C|maletero|estás aquí|LIVE GPS|en tiempo real|tráfico fluido|85\s*km|10:00|10:20|10:55|11:15|11:30|efectivo|tarjeta Va y Ven/i)
  })

  it.each([
    ['izamal', 'Izamal', 'izamal-detalle'],
    ['valladolid', 'Valladolid', 'izamal-detalle'],
    ['tekit', 'Tekit', 'izamal-detalle'],
    ['homun', 'Homún', 'izamal-detalle'],
    ['ticul', 'Ticul', 'izamal-detalle'],
  ])('abre desde el catálogo el detalle propio de %s', async (id, nombre, clase) => {
    const { router } = montar('/rutas')
    await userEvent.click(screen.getByRole('link', { name: `Ver ruta a ${nombre}` }))
    expect(router.state.location.pathname).toBe(`/rutas/${id}`)
    expect(screen.getByRole('article', { name: nombre })).toHaveClass(clase)
    expect(screen.getByRole('heading', { name: `Descubre ${nombre} a tu ritmo` })).toBeInTheDocument()
    expect(screen.queryByText('Este módulo está en desarrollo (CU-03).')).not.toBeInTheDocument()
  })

  it('conserva el estado de destino desconocido y el regreso al catálogo', async () => {
    const { router } = montar('/rutas/no-existe')
    expect(screen.getByRole('heading', { name: 'Ruta no encontrada' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Ticul' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Volver al catálogo de rutas' }))
    expect(router.state.location.pathname).toBe('/rutas')
    expect(screen.getByRole('link', { name: 'Ver ruta a Ticul' })).toBeInTheDocument()
  })
})
