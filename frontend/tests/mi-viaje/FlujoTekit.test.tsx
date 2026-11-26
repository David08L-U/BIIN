import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../src/types/auth'
import { router as routerAplicacion } from '../../src/app/router'
import { guardarItinerarioLocal, leerItinerariosLocales } from '../../src/features/mi-viaje/storage/itinerariosLocales'
import { crearBorradorTekit, leerBorradorTekit } from '../../src/features/mi-viaje/plan/borradorTekit'
import { crearBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { leerBorradorIzamal } from '../../src/features/mi-viaje/plan/borradorIzamal'
import { calcularPlanTekit } from '../../src/features/mi-viaje/plan/itinerarioTekit'
import * as acciones from '../../src/features/mi-viaje/plan/accionesTekit'

const sesion = vi.hoisted(() => ({ usuario: null as Usuario | null, cargando: false }))
vi.mock('../../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: sesion.usuario, cargando: sesion.cargando, tieneRol: () => false, cerrarSesion: vi.fn(), iniciarSesion: async () => { sesion.usuario = { idUsuario: 7, nombre: 'Ana', correo: 'ana@biin.test', roles: ['viajero'] } } }),
}))
const config = 'estancia=medio-dia&fecha=2026-11-30&inicio=10%3A20&minutos=240'
const routers: ReturnType<typeof createMemoryRouter>[] = []
function montar(url = '/rutas/tekit/personalizar') {
  const router = createMemoryRouter(routerAplicacion.routes, { initialEntries: [url] })
  routers.push(router)
  return { router, ...render(<RouterProvider router={router} />) }
}
function autenticar() { sesion.usuario = { idUsuario: 7, nombre: 'Ana', correo: 'ana@biin.test', roles: ['viajero'] } }
beforeEach(() => { sesion.usuario = null; sesion.cargando = false; localStorage.clear() })
afterEach(() => { routers.splice(0).forEach(r => r.dispose()); vi.restoreAllMocks(); vi.unstubAllGlobals() })
afterAll(() => routerAplicacion.dispose())

describe('Flujo de Tekit CU-09 / RF09', () => {
  it.each(['itinerario', 'itinerario/', 'personalizar', 'personalizar/'])('abre directamente %s con una navegación, Rutas activa y sin resultado', ruta => {
    const { container } = montar(`/rutas/tekit/${ruta}`)
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(1)
    expect(within(nav).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
    expect(container.querySelector('.biin-cabecera-simple')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Horas')).toHaveValue(4)
    expect(screen.getByLabelText('Minutos')).toHaveValue(0)
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
  })

  it('comienza personalizado vacío y exige fecha y selección antes de generar', async () => {
    montar()
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').every(c => !(c as HTMLInputElement).checked)).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('fecha válida')
    fireEvent.change(screen.getByLabelText('Fecha de visita'), { target: { value: '2026-11-30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona al menos un lugar')
  })

  it('quita un lugar solo de la selección y permite generar el estado vacío válido', async () => {
    const { router } = montar(`/rutas/tekit/personalizar?${config}&modo=personalizado&lugares=corredor-textil,comida-mercado&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Corredor Textil y Tiendas de Fabricantes del itinerario' }))
    expect(screen.getByText('1 lugares seleccionados')).toBeInTheDocument()
    expect(new URLSearchParams(router.state.location.search).get('lugares')).toBe('comida-mercado')
    expect(new URLSearchParams(router.state.location.search).has('generado')).toBe(false)
    expect(screen.getByRole('checkbox', { name: 'Corredor Textil y Tiendas de Fabricantes' })).not.toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Cocina Económica Doña Lupita y Mercado del itinerario' }))
    expect(screen.getByText('Aún no hay lugares seleccionados. El recorrido se puede generar vacío.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona al menos un lugar')
  })

  it('selecciona con teclado, conserva otras categorías y actualiza tiempos y contadores', async () => {
    montar(`/rutas/tekit/personalizar?${config}`)
    const corredor = screen.getByRole('checkbox', { name: 'Corredor Textil y Tiendas de Fabricantes' })
    corredor.focus()
    await userEvent.keyboard(' ')
    expect(corredor).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: /Gastronomía/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cocina Económica Doña Lupita y Mercado' }))
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ruta Textil & Talleres.*1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gastronomía.*1/ })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Resumen de selección' })).toHaveTextContent('1 h 55 min de visitas + 9 min de desplazamientos con regreso + 15 min de margen')
    await userEvent.click(screen.getByRole('button', { name: /Ruta Textil & Talleres/ }))
    expect(screen.getByRole('checkbox', { name: 'Corredor Textil y Tiendas de Fabricantes' })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(2)
  })

  it.each(['Restablecer selección', 'Reiniciar selección'])('%s limpia selección y generación, conservando configuración', async nombre => {
    const { router } = montar(`/rutas/tekit/personalizar?${config}&modo=personalizado&lugares=corredor-textil,comida-mercado&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: nombre }))
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    const p = new URLSearchParams(router.state.location.search)
    expect(p.has('lugares')).toBe(false)
    expect(p.has('generado')).toBe(false)
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona al menos un lugar')
  })

  it('pide minutos en Ruta Textil y nunca añade comida automáticamente', async () => {
    montar('/rutas/tekit')
    await userEvent.click(screen.getByRole('radio', { name: /Ruta Textil.*Compras/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Itinerario recomendado en Tekit' }))
    expect(screen.getByLabelText('Horas')).toHaveValue(null)
    expect(screen.getByLabelText('Minutos')).toHaveValue(null)
    fireEvent.change(screen.getByLabelText('Fecha de visita'), { target: { value: '2026-11-30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getByRole('alert')).toHaveTextContent('no tiene duración fija')
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Horas'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Minutos'), { target: { value: '0' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(2)
    expect(screen.queryByRole('heading', { name: 'Cocina Económica Doña Lupita y Mercado' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Parroquia de San Antonio de Padua' })).not.toBeInTheDocument()
    expect(screen.getByText(/Tiempo libre: 3 h 47 min/)).toBeInTheDocument()
  })

  it('muestra exceso sin eliminar selección y no permite guardar el resultado inválido', async () => {
    const { router } = montar(`/rutas/tekit/personalizar?${config.replace('minutos=240', 'minutos=100')}&modo=personalizado&lugares=corredor-textil,taller-bordado`)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('excede el tiempo disponible por 33 min')
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/rutas/tekit/personalizar')
    expect(screen.getByRole('checkbox', { name: 'Taller Artesanal de Bordado y Deshilado' })).toBeChecked()
    expect(localStorage.length).toBe(0)
  })

  it.each([
    ['Hora de inicio', '', 'hora de inicio válida'],
    ['Horas', '1.5', 'número entero'],
    ['Fecha de visita', '', 'fecha válida'],
  ])('valida %s antes de generar', async (campo, valor, mensaje) => {
    montar(`/rutas/tekit/itinerario?${config}`)
    fireEvent.change(screen.getByLabelText(campo), { target: { value: valor } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getByRole('alert')).toHaveTextContent(mensaje)
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
  })

  it('explica parámetros inválidos y parciales aunque pidan un resultado generado', () => {
    montar('/rutas/tekit/itinerario?estancia=otra&fecha=2026-02-30&inicio=25:00&modo=otro&lugares=kinich&generado=1')
    const alerta = screen.getByRole('alert')
    for (const texto of ['modalidad válida', 'fecha válida', 'hora de inicio válida', 'número entero', 'modo válido', 'lugares desconocidos']) expect(alerta).toHaveTextContent(texto)
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
  })

  it('recarga el resultado y conserva configuración y selección al alternar, volver y editar', async () => {
    const primera = montar(`/rutas/tekit/itinerario?${config}`)
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getByText(/3 h 39 min estimadas/)).toBeInTheDocument()
    const url = primera.router.state.location.pathname + primera.router.state.location.search
    primera.unmount()
    const segunda = montar(url)
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Personalizado' }))
    expect(screen.getByText('4 lugares seleccionados')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Taller Artesanal de Bordado y Deshilado' }))
    expect(new URLSearchParams(segunda.router.state.location.search).has('generado')).toBe(false)
    await userEvent.click(screen.getByRole('link', { name: 'Recomendado' }))
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '11:00' } })
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    await userEvent.click(screen.getByRole('link', { name: 'Volver a detalle de ruta' }))
    await userEvent.click(screen.getByRole('button', { name: 'Itinerario recomendado en Tekit' }))
    expect(screen.getByLabelText('Hora de inicio')).toHaveValue('11:00')
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
  })

  it('personalizar conserva las paradas del resultado, y un cambio de modalidad invalida el resultado', async () => {
    const { router } = montar(`/rutas/tekit/itinerario?${config}&modo=personalizado&lugares=taller-bordado,corredor-textil&generado=1`)
    await userEvent.click(screen.getByRole('link', { name: 'Personalizar' }))
    expect(screen.getByRole('checkbox', { name: 'Corredor Textil y Tiendas de Fabricantes' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Taller Artesanal de Bordado y Deshilado' })).toBeChecked()
    expect(new URLSearchParams(router.state.location.search).get('lugares')).toBe('taller-bordado,corredor-textil')
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    await userEvent.selectOptions(screen.getByLabelText('Estancia o modalidad'), 'ruta-textil')
    expect(screen.getByLabelText('Horas')).toHaveValue(null)
    expect(screen.getByLabelText('Minutos')).toHaveValue(null)
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
  })

  it('atrás y adelante recuperan cada borrador con su estado de generación válido', async () => {
    const { router } = montar(`/rutas/tekit/itinerario?${config}&generado=1`)
    await userEvent.click(screen.getByRole('link', { name: 'Personalizar' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Taller Artesanal de Bordado y Deshilado' }))
    expect(screen.getByText('3 lugares seleccionados')).toBeInTheDocument()
    await act(async () => { await router.navigate(-1) })
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(4)
    await act(async () => { await router.navigate(1) })
    expect(screen.getByText('3 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
    expect(new URLSearchParams(router.state.location.search).has('generado')).toBe(false)
  })

  it('filtrar el resultado conserva URL, horarios y plan completo al guardar y descargar', async () => {
    autenticar()
    const descarga = vi.spyOn(acciones, 'descargarTekit').mockImplementation(() => {})
    const { router } = montar(`/rutas/tekit/itinerario?${config}&generado=1`)
    const consulta = router.state.location.search
    await userEvent.click(screen.getByRole('button', { name: 'Gastronomía' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(1)
    expect(router.state.location.search).toBe(consulta)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    const item = leerItinerariosLocales(7).itinerarios[0]
    expect(item.destino).toBe('tekit')
    expect(item.borrador.seleccion).toHaveLength(4)
    await userEvent.click(screen.getByRole('button', { name: 'Descargar plan' }))
    expect(descarga.mock.calls[0][1].seleccion).toHaveLength(4)
    await userEvent.click(screen.getByRole('button', { name: 'Ruta Textil & Talleres' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Ruta Sugerida' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(4)
  })

  it('pide acceso, recupera el borrador y guarda una sola vez en Mi viaje', async () => {
    const { router } = montar(`/rutas/tekit/itinerario?${config}&modo=personalizado&lugares=taller-bordado,corredor-textil&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state.desde).toContain('/rutas/tekit/itinerario?')
    expect(localStorage.length).toBe(0)
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@biin.test')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'ejemplo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
    expect(leerBorradorTekit(new URLSearchParams(router.state.location.search)).seleccion).toEqual(['taller-bordado', 'corredor-textil'])
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(screen.getByText('Guardado en este navegador')).toHaveAttribute('role', 'status')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar en Mi viaje' }))
    await userEvent.click(screen.getByRole('link', { name: 'Ver mis itinerarios guardados' }))
    expect(screen.getAllByRole('link', { name: 'Abrir itinerario de Tekit' })).toHaveLength(1)
    await userEvent.click(screen.getByRole('link', { name: 'Abrir itinerario de Tekit' }))
    expect(screen.getByRole('heading', { name: 'Tu Itinerario en Tekit' })).toBeInTheDocument()
  })

  it('lista y abre los tres destinos, incluyendo Izamal antiguo y Valladolid de dos jornadas', async () => {
    autenticar()
    const antiguo = leerBorradorIzamal(new URLSearchParams('estancia=medio-dia&fecha=2026-11-30&inicio=11:30&minutos=240&generado=1'))
    localStorage.setItem('biin:itinerarios:v1:7', JSON.stringify({ version: 1, itinerarios: [{ id: 'izamal:antiguo', guardadoEn: '2026-11-20T12:00:00Z', borrador: antiguo }] }))
    const va = crearBorradorValladolid('fin-de-semana')
    va.configuracion.fecha = '2026-11-30'; va.generado = true
    guardarItinerarioLocal(7, va)
    const tk = crearBorradorTekit()
    tk.configuracion.fecha = '2026-11-30'; tk.generado = true
    guardarItinerarioLocal(7, tk)
    guardarItinerarioLocal(8, { ...tk, configuracion: { ...tk.configuracion, fecha: '2026-12-24' } })
    montar('/mi-viaje')
    expect(screen.queryByText(/2026-12-24/)).not.toBeInTheDocument()
    for (const [nombre, titulo] of [['Tekit', 'Tu Itinerario en Tekit'], ['Izamal', 'Tu Itinerario en Izamal'], ['Valladolid', 'Tu Itinerario en Valladolid']]) {
      expect(screen.getAllByRole('link', { name: `Abrir itinerario de ${nombre}` })).toHaveLength(1)
      await userEvent.click(screen.getByRole('link', { name: `Abrir itinerario de ${nombre}` }))
      expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument()
      if (nombre === 'Valladolid') expect(screen.getByRole('heading', { name: 'Día 2 · 2026-12-01' })).toBeInTheDocument()
      await userEvent.click(screen.getByRole('link', { name: 'Ver mis itinerarios guardados' }))
    }
  })

  it('no anuncia éxito si falla guardar y permite seguir preparando la vista previa', async () => {
    autenticar()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    montar(`/rutas/tekit/itinerario?${config}&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar')
    expect(screen.queryByText('Guardado en este navegador')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
  })

  it('cancelar compartir no copia ni muestra éxito', async () => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue({ name: 'AbortError' }), clipboard: { writeText } })
    montar(`/rutas/tekit/itinerario?${config}&generado=1`)
    // fireEvent no requiere los métodos de navigator que usa user-event.
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }))
    expect(await screen.findByText(/Se canceló compartir/)).toHaveAttribute('role', 'status')
    expect(writeText).not.toHaveBeenCalled()
    expect(screen.queryByText('Vista previa compartida.')).not.toBeInTheDocument()
  })

  it('ofrece enlace reproducible manual y comunica fallo de descarga', async () => {
    vi.spyOn(acciones, 'compartirTekit').mockResolvedValue({ estado: 'manual', mensaje: 'Copia este enlace manualmente.' })
    vi.spyOn(acciones, 'descargarTekit').mockImplementation(() => { throw new Error('Descarga bloqueada') })
    montar(`/rutas/tekit/itinerario?${config}&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: 'Compartir' }))
    const enlace = await screen.findByLabelText('Enlace de la vista previa') as HTMLInputElement
    const b = leerBorradorTekit(new URL(enlace.value).searchParams)
    expect(calcularPlanTekit(b).plan!.seleccion).toHaveLength(4)
    expect(enlace.value).not.toMatch(/idUsuario|correo|token/)
    await userEvent.click(screen.getByRole('button', { name: 'Descargar plan' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo descargar')
    expect(screen.queryByText(/Se solicitó la descarga/)).not.toBeInTheDocument()
  })

  it('abre el detalle desde el circuito sin simular ubicación ni información de transporte', async () => {
    const { container, router } = montar(`/rutas/tekit/itinerario?${config}&generado=1`)
    expect(container).not.toHaveTextContent(/Abrir vista en vivo|Radio 400 m|Salida 2:00 PM|Salidas cada 40 min|Entrada libre|Visita guiada taller|1.5 km totales/)
    expect(screen.getByRole('heading', { name: 'Circuito Artesanal Tekit' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Ver detalle de ruta' }))
    expect(router.state.location.pathname).toBe('/rutas/tekit')
    expect(screen.getByRole('radio', { name: /Medio día/ })).toBeChecked()
  })

  it('mantiene Mi viaje protegido', async () => {
    const { router } = montar('/mi-viaje')
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ desde: '/mi-viaje' })
  })
})
