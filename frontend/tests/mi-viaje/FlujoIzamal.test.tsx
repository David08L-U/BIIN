import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../src/types/auth'
import { router as routerAplicacion } from '../../src/app/router'
import { guardarItinerarioLocal } from '../../src/features/mi-viaje/storage/itinerariosLocales'
import { leerBorradorIzamal } from '../../src/features/mi-viaje/plan/borradorIzamal'

const sesion = vi.hoisted(() => ({ usuario: null as Usuario | null, cargando: false }))
vi.mock('../../src/features/auth/useAuth', () => ({
  useAuth: () => ({
    usuario: sesion.usuario,
    cargando: sesion.cargando,
    tieneRol: () => false,
    cerrarSesion: vi.fn(),
    iniciarSesion: async () => { sesion.usuario = { idUsuario: 7, nombre: 'Ana', correo: 'ana@biin.test', roles: ['viajero'] } },
  }),
}))

const configuracion = 'estancia=medio-dia&fecha=2026-11-30&inicio=11%3A30&minutos=240'
const routers: ReturnType<typeof createMemoryRouter>[] = []
function montar(url = '/rutas/izamal/personalizar') {
  const router = createMemoryRouter(routerAplicacion.routes, { initialEntries: [url] })
  routers.push(router)
  const vista = render(<RouterProvider router={router} />)
  return { router, ...vista }
}
beforeEach(() => {
  sesion.usuario = null
  sesion.cargando = false
  localStorage.clear()
})
afterEach(() => { routers.splice(0).forEach(router => router.dispose()); vi.restoreAllMocks() })
afterAll(() => routerAplicacion.dispose())

describe('Flujo de itinerarios de Izamal CU-09', () => {
  it.each(['itinerario', 'personalizar'])('abre directamente %s y conserva una sola navegación con Rutas activa', modo => {
    const { container } = montar(`/rutas/izamal/${modo}?estancia=tarde-magica`)
    expect(screen.getByLabelText('Tiempo disponible (minutos)')).toHaveValue(180)
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(1)
    expect(within(screen.getByRole('navigation', { name: 'Navegación principal' })).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
    expect(container.querySelector('.biin-cabecera-simple')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
  })

  it('inicia la personalización vacía y exige fecha y al menos un lugar', async () => {
    montar()
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').every(checkbox => !(checkbox as HTMLInputElement).checked)).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Elige una fecha válida')
    fireEvent.change(screen.getByLabelText('Fecha de visita'), { target: { value: '2026-11-30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona al menos un lugar')
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
  })

  it('conserva selecciones al filtrar, actualiza contadores y restablece', async () => {
    const { router } = montar(`/rutas/izamal/personalizar?${configuracion}`)
    const user = userEvent.setup()
    await user.click(screen.getByRole('checkbox', { name: 'Restaurante Kinich' }))
    await user.click(screen.getByRole('button', { name: /Talleres y cultura/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Taller de Semilla de Ramón' }))
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Restaurantes.*1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Talleres y cultura.*1/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Restaurantes/ }))
    expect(screen.getByRole('checkbox', { name: 'Restaurante Kinich' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Reiniciar selección' }))
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Restaurante Kinich' })).not.toBeChecked()
    expect(new URLSearchParams(router.state.location.search).has('lugares')).toBe(false)
    expect(new URLSearchParams(router.state.location.search).has('generado')).toBe(false)
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
  })

  it.each([
    ['Hora de inicio', '', 'Elige una hora de inicio válida'],
    ['Tiempo disponible (minutos)', '12.5', 'número entero entre 15 y 720'],
  ])('valida %s antes de generar una recomendación', async (campo, valor, mensaje) => {
    montar(`/rutas/izamal/itinerario?${configuracion}`)
    fireEvent.change(screen.getByLabelText(campo), { target: { value: valor } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getByRole('alert')).toHaveTextContent(mensaje)
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
  })

  it('no elimina la selección que excede el presupuesto y permite corregirla', async () => {
    montar(`/rutas/izamal/personalizar?${configuracion}&lugares=kinich,convento`)
    fireEvent.change(screen.getByLabelText('Tiempo disponible (minutos)'), { target: { value: '120' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('excede el tiempo disponible por 27 minutos')
    expect(screen.getByRole('checkbox', { name: 'Restaurante Kinich' })).toBeChecked()
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Tiempo disponible (minutos)'), { target: { value: '240' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
  })

  it('genera un recomendado, invalida el resultado al editar y conserva los campos al volver y recargar', async () => {
    const primera = montar(`/rutas/izamal/itinerario?${configuracion}`)
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    expect(screen.getByText('Objetivo del usuario; no es una salida confirmada de van.')).toBeInTheDocument()
    const url = primera.router.state.location.pathname + primera.router.state.location.search
    primera.unmount()
    montar(url)
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '12:45' } })
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    await userEvent.click(screen.getByRole('link', { name: 'Volver a detalle de ruta' }))
    await userEvent.click(screen.getByRole('button', { name: 'Personalizar mi itinerario' }))
    expect(screen.getByLabelText('Hora de inicio')).toHaveValue('12:45')
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
  })

  it('personaliza un plan previo conservando selección y permite limpiar el resultado anterior', async () => {
    montar(`/rutas/izamal/itinerario?${configuracion}&modo=personalizado&lugares=kinich&generado=1`)
    await userEvent.click(screen.getByRole('link', { name: 'Personalizar' }))
    expect(screen.getByRole('checkbox', { name: 'Restaurante Kinich' })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Restablecer selección' }))
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona al menos un lugar')
  })

  it('filtra las tarjetas del resultado conservando los horarios y el plan completo', async () => {
    const { router } = montar(`/rutas/izamal/itinerario?${configuracion}&modo=personalizado&lugares=convento,kinich&generado=1`)
    const consulta = router.state.location.search
    const fechaVisita = screen.getAllByText(/Visita estimada:/)
    expect(fechaVisita).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Gastronomía Típica' }))
    expect(screen.queryByRole('heading', { name: 'Convento San Antonio de Padua' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Restaurante Kinich' })).toBeInTheDocument()
    expect(router.state.location.search).toBe(consulta)
    await userEvent.click(screen.getByRole('button', { name: 'Ruta Sugerida' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(2)
  })

  it('permite teclado en los controles nativos de selección', async () => {
    montar(`/rutas/izamal/personalizar?${configuracion}`)
    const checkbox = screen.getByRole('checkbox', { name: 'Restaurante Kinich' })
    checkbox.focus()
    await userEvent.keyboard(' ')
    expect(checkbox).toBeChecked()
  })

  it('pide acceso al guardar, retoma el borrador, guarda y abre desde Mi viaje', async () => {
    const { router } = montar(`/rutas/izamal/itinerario?${configuracion}&generado=1`)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state.desde).toContain('/rutas/izamal/itinerario?')
    expect(localStorage.length).toBe(0)
    await user.type(screen.getByLabelText('Correo'), 'ana@biin.test')
    await user.type(screen.getByLabelText('Contraseña'), 'ejemplo')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
    await user.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(screen.getByText('Guardado en este navegador')).toHaveAttribute('role', 'status')
    await user.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    await user.click(screen.getByRole('link', { name: 'Ver mis itinerarios guardados' }))
    expect(router.state.location.pathname).toBe('/mi-viaje')
    expect(screen.getAllByRole('link', { name: 'Abrir itinerario de Izamal' })).toHaveLength(1)
    await user.click(screen.getByRole('link', { name: 'Abrir itinerario de Izamal' }))
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
  })

  it('muestra el fallo de guardado sin mensaje de éxito', async () => {
    sesion.usuario = { idUsuario: 7, nombre: 'Ana', correo: 'ana@biin.test', roles: ['viajero'] }
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    montar(`/rutas/izamal/itinerario?${configuracion}&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar')
    expect(screen.queryByText('Guardado en este navegador')).not.toBeInTheDocument()
  })

  it('lista solo los itinerarios de la cuenta actual y maneja datos dañados', () => {
    const borrador = leerBorradorIzamal(new URLSearchParams(`${configuracion}&generado=1`))
    guardarItinerarioLocal(7, borrador)
    sesion.usuario = { idUsuario: 8, nombre: 'Beto', correo: 'beto@biin.test', roles: ['viajero'] }
    localStorage.setItem('biin:itinerarios:v1:8', '{dañado')
    montar('/mi-viaje')
    expect(screen.getByRole('heading', { name: 'Mis itinerarios' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/bloqueado o dañado/)
    expect(screen.queryByRole('link', { name: 'Abrir itinerario de Izamal' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Preparar otro itinerario en Izamal' })).toBeInTheDocument()
  })

  it('mantiene las acciones disponibles cuando fallan las imágenes y no simula servicios', () => {
    const { container } = montar(`/rutas/izamal/itinerario?${configuracion}&generado=1`)
    for (const imagen of screen.getAllByRole('img')) fireEvent.error(imagen)
    expect(screen.getAllByText('Imagen del prototipo no disponible').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Personalizar' })).toBeInTheDocument()
    expect(container).not.toHaveTextContent(/Apartando asiento|Abrir vista en vivo|\d+[.,]\d+ km totales/)
  })

  it('conserva la protección real de /mi-viaje y su retorno de acceso', async () => {
    const { router } = montar('/mi-viaje')
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state).toEqual({ desde: '/mi-viaje' })
    expect(screen.queryByRole('heading', { name: 'Mis itinerarios' })).not.toBeInTheDocument()
  })
})
