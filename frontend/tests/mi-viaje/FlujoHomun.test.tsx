import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../src/types/auth'
import { router as routerAplicacion } from '../../src/app/router'
import { guardarItinerarioLocal } from '../../src/features/mi-viaje/storage/itinerariosLocales'
import { crearBorradorHomun, leerBorradorHomun } from '../../src/features/mi-viaje/plan/borradorHomun'
import { crearBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { crearBorradorTekit } from '../../src/features/mi-viaje/plan/borradorTekit'
import { leerBorradorIzamal } from '../../src/features/mi-viaje/plan/borradorIzamal'
import { calcularPlanHomun } from '../../src/features/mi-viaje/plan/itinerarioHomun'
import * as acciones from '../../src/features/mi-viaje/plan/accionesHomun'

const sesion = vi.hoisted(() => ({ usuario: null as Usuario | null, cargando: false }))
vi.mock('../../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: sesion.usuario, cargando: sesion.cargando, tieneRol: () => false, cerrarSesion: vi.fn(), iniciarSesion: async () => { sesion.usuario = { idUsuario: 7, nombre: 'Ana', correo: 'ana@biin.test', roles: ['viajero'] } } }),
}))
const config = 'estancia=medio-dia&fecha=2026-11-30&inicio=09%3A55&minutos=270&inicio2=09%3A00&minutos2=270'
const finde = config.replace('estancia=medio-dia', 'estancia=fin-de-semana')
const routers: ReturnType<typeof createMemoryRouter>[] = []
function montar(url = '/rutas/homun/personalizar') {
  const router = createMemoryRouter(routerAplicacion.routes, { initialEntries: [url] })
  routers.push(router)
  return { router, ...render(<RouterProvider router={router} />) }
}
function autenticar() { sesion.usuario = { idUsuario: 7, nombre: 'Ana', correo: 'ana@biin.test', roles: ['viajero'] } }
beforeEach(() => { sesion.usuario = null; sesion.cargando = false; localStorage.clear() })
afterEach(() => { routers.splice(0).forEach(r => r.dispose()); vi.restoreAllMocks(); vi.unstubAllGlobals() })
afterAll(() => routerAplicacion.dispose())

describe('Flujo de Homún CU-09 / RF09', () => {
  it.each(['itinerario', 'itinerario/', 'personalizar', 'personalizar/'])('abre %s directamente con Rutas activa y una sola navegación', ruta => {
    const { container } = montar(`/rutas/homun/${ruta}`)
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(1)
    expect(within(nav).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
    expect(container.querySelector('.biin-cabecera-simple')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Horas del Día 1')).toHaveValue(4)
    expect(screen.getByLabelText('Minutos del Día 1')).toHaveValue(30)
    expect(screen.queryByRole('heading', { name: 'Paso a paso en mototaxi y a pie' })).not.toBeInTheDocument()
  })
  it('comienza personalizado vacío y exige fecha y selección', async () => {
    montar()
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').every(c => !(c as HTMLInputElement).checked)).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('fecha válida')
    fireEvent.change(screen.getByLabelText('Fecha de visita'), { target: { value: '2026-11-30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('selecciona al menos un lugar')
  })
  it('selecciona con teclado y conserva categorías, contadores y tiempos reales', async () => {
    montar(`/rutas/homun/personalizar?${config}`)
    const santa = screen.getByRole('checkbox', { name: 'Cenote Santa Rosa' })
    santa.focus(); await userEvent.keyboard(' ')
    expect(santa).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: /Gastronomía/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Restaurante El Cenote y Cocina Tradicional' }))
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cenotes & Cavernas.*1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gastronomía.*1/ })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Resumen del Día 1' })).toHaveTextContent('2 h 15 min de visitas + 12 min de traslados con regreso + 15 min de margen')
    await userEvent.click(screen.getByRole('button', { name: /Cenotes & Cavernas/ }))
    expect(screen.getByRole('checkbox', { name: 'Cenote Santa Rosa' })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(2)
  })
  it('asigna visitas por jornada, deriva la fecha local y conserva ambas al personalizar', async () => {
    montar(`/rutas/homun/personalizar?${finde}`)
    expect(screen.getByLabelText('Fecha del Día 2')).toHaveValue('2026-12-01')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cenote Santa Rosa' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cenote Tza Ujun Kat' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Jornada de Cenote Tza Ujun Kat' }), '2')
    expect(screen.getByRole('status', { name: 'Resumen del Día 1' })).toHaveTextContent('1 h 15 min de visitas')
    expect(screen.getByRole('status', { name: 'Resumen del Día 2' })).toHaveTextContent('1 h 5 min de visitas')
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    const dia1 = screen.getByRole('region', { name: /Día 1 · 2026-11-30 ·/ })
    const dia2 = screen.getByRole('region', { name: /Día 2 · 2026-12-01 ·/ })
    expect(within(dia1).getByRole('heading', { name: 'Cenote Santa Rosa' })).toBeInTheDocument()
    expect(within(dia1).queryByRole('heading', { name: 'Cenote Tza Ujun Kat' })).not.toBeInTheDocument()
    expect(within(dia2).getByRole('heading', { name: 'Cenote Tza Ujun Kat' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Personalizar' }))
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Jornada de Cenote Tza Ujun Kat' })).toHaveValue('2')
  })
  it.each(['Restablecer selección', 'Reiniciar selección'])('%s limpia ambas jornadas y resultado conservando configuración', async nombre => {
    const { router } = montar(`/rutas/homun/personalizar?${finde}&modo=personalizado&dia1=santa-rosa&dia2=tza-ujun-kat&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: nombre }))
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    const p = new URLSearchParams(router.state.location.search)
    for (const campo of ['dia1', 'dia2', 'generado']) expect(p.has(campo)).toBe(false)
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
    expect(screen.getByLabelText('Fecha del Día 2')).toHaveValue('2026-12-01')
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Día 1: selecciona al menos un lugar')
    expect(screen.getByRole('alert')).toHaveTextContent('Día 2: selecciona al menos un lugar')
  })
  it('explica exceso por día sin compensarlo con el otro ni quitar visitas', async () => {
    montar(`/rutas/homun/personalizar?${finde.replace('minutos=270', 'minutos=120').replace('minutos2=270', 'minutos2=540')}&modo=personalizado&dia1=santa-rosa,tza-ujun-kat,restaurante-cenote&dia2=plaza-parroquia`)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Día 1: la selección excede el tiempo disponible por 1 h 52 min')
    expect(screen.getByText('4 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Cenote Santa Rosa' })).toBeChecked()
    expect(localStorage.length).toBe(0)
  })
  it.each([
    ['Fecha de visita', '', 'fecha válida'], ['Hora de inicio del Día 1', '25:00', 'hora de inicio válida'],
    ['Horas del Día 1', '1.5', 'número entero'],
    ['Hora de inicio del Día 2', '21:00', 'Día 2: la ventana'],
    ['Horas del Día 2', '48', 'Día 2: el tiempo'],
  ])('valida %s antes de generar', async (campo, valor, mensaje) => {
    montar(`/rutas/homun/itinerario?${finde}`)
    fireEvent.change(screen.getByLabelText(campo), { target: { value: valor } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getByRole('alert')).toHaveTextContent(mensaje)
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    expect(screen.queryByRole('heading', { name: 'Paso a paso en mototaxi y a pie' })).not.toBeInTheDocument()
  })
  it('valida enlaces parciales o manipulados que piden resultado generado', () => {
    montar('/rutas/homun/itinerario?estancia=otra&fecha=2026-02-30&inicio=25:00&modo=otro&dia1=zaci&generado=1')
    for (const texto of ['estancia válida', 'fecha válida', 'hora de inicio válida', 'número entero', 'modo válido', 'lugares desconocidos']) expect(screen.getByRole('alert')).toHaveTextContent(texto)
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
  })
  it('genera y recarga dos jornadas sin repetir lugares; editar configuración invalida resultado', async () => {
    const primera = montar(`/rutas/homun/itinerario?${finde}`)
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(4)
    const url = primera.router.state.location.pathname + primera.router.state.location.search
    primera.unmount()
    montar(url)
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(4)
    expect(screen.getAllByRole('heading', { name: 'Cenote Santa Rosa' })).toHaveLength(1)
    fireEvent.change(screen.getByLabelText('Hora de inicio del Día 2'), { target: { value: '10:00' } })
    expect(screen.queryByRole('heading', { name: 'Paso a paso en mototaxi y a pie' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    await userEvent.click(screen.getByRole('link', { name: 'Volver a detalle de ruta' }))
    expect(screen.getByRole('radio', { name: /Fin de semana/ })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Itinerario recomendado en Homún' }))
    expect(screen.getByLabelText('Hora de inicio del Día 2')).toHaveValue('10:00')
  })
  it('conserva configuración y selección al alternar modos y navegar atrás/adelante', async () => {
    const { router } = montar(`/rutas/homun/itinerario?${config}&generado=1`)
    expect(screen.getByText(/4 h 29 min estimadas/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Personalizado' }))
    expect(screen.getByText('4 lugares seleccionados')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cenote Santa Rosa' }))
    expect(screen.getByText('3 lugares seleccionados')).toBeInTheDocument()
    expect(new URLSearchParams(router.state.location.search).has('generado')).toBe(false)
    await act(async () => { await router.navigate(-1) })
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(4)
    await act(async () => { await router.navigate(1) })
    expect(screen.getByText('3 lugares seleccionados')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Recomendado' }))
    expect(screen.queryByRole('heading', { name: 'Paso a paso en mototaxi y a pie' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
  })
  it('editar una asignación o selección invalida cualquier resultado anterior en la URL', async () => {
    const { router } = montar(`/rutas/homun/personalizar?${finde}&modo=personalizado&dia1=santa-rosa&dia2=tza-ujun-kat&generado=1`)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Jornada de Cenote Tza Ujun Kat' }), '1')
    expect(new URLSearchParams(router.state.location.search).has('generado')).toBe(false)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cenote Santa Rosa' }))
    expect(screen.getByText('1 lugares seleccionados')).toBeInTheDocument()
    expect(new URLSearchParams(router.state.location.search).has('generado')).toBe(false)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Día 2: selecciona al menos un lugar')
  })
  it('filtra solo la vista; guardar y descargar conservan el plan completo', async () => {
    autenticar()
    const descarga = vi.spyOn(acciones, 'descargarHomun').mockImplementation(() => {})
    const { router } = montar(`/rutas/homun/itinerario?${config}&generado=1`)
    const consulta = router.state.location.search
    await userEvent.click(screen.getByRole('button', { name: 'Gastronomía' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(1)
    expect(router.state.location.search).toBe(consulta)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    const [guardadoServidor] = await (await fetch('/api/itinerarios')).json() as { borrador: { seleccion: unknown[] } }[]
    expect(guardadoServidor.borrador.seleccion).toHaveLength(4)
    await userEvent.click(screen.getByRole('button', { name: 'Descargar plan' }))
    expect(descarga.mock.calls[0][1].seleccion).toHaveLength(4)
    await userEvent.click(screen.getByRole('button', { name: 'Cenotes & Cavernas' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Ruta Sugerida' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(4)
  })
  it('recupera el borrador tras el acceso y guarda sin duplicar en Mi viaje', async () => {
    const { router } = montar(`/rutas/homun/itinerario?${finde}&modo=personalizado&dia1=santa-rosa&dia2=tza-ujun-kat&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state.desde).toContain('/rutas/homun/itinerario?')
    expect(localStorage.length).toBe(0)
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@biin.test')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'ejemplo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: 'Paso a paso en mototaxi y a pie' })).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha del Día 2')).toHaveValue('2026-12-01')
    expect(leerBorradorHomun(new URLSearchParams(router.state.location.search)).seleccion).toEqual([{ lugarId: 'santa-rosa', dia: 1 }, { lugarId: 'tza-ujun-kat', dia: 2 }])
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(await screen.findByRole('status')).toHaveTextContent('tu cuenta')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar en Mi viaje' }))
    await userEvent.click(screen.getByRole('link', { name: 'Ver mis itinerarios guardados' }))
    expect(await screen.findAllByRole('link', { name: 'Abrir itinerario de Homún' })).toHaveLength(1)
    await userEvent.click(screen.getByRole('link', { name: 'Abrir itinerario de Homún' }))
    expect(screen.getByRole('heading', { name: 'Tu Itinerario en Homún' })).toBeInTheDocument()
  })
  it('lista y abre los cuatro destinos de la cuenta con enlaces propios', async () => {
    autenticar()
    const iz = leerBorradorIzamal(new URLSearchParams('estancia=medio-dia&fecha=2026-11-30&inicio=11:30&minutos=240&generado=1'))
    localStorage.setItem('biin:itinerarios:v1:7', JSON.stringify({ version: 1, itinerarios: [{ id: 'izamal:antiguo', guardadoEn: '2026-11-20T12:00:00Z', borrador: iz }] }))
    const va = crearBorradorValladolid('fin-de-semana'); va.configuracion.fecha = '2026-11-30'; va.generado = true; guardarItinerarioLocal(7, va)
    const tk = crearBorradorTekit('ruta-textil'); tk.configuracion.fecha = '2026-11-30'; tk.configuracion.minutosDisponibles = '180'; tk.generado = true; guardarItinerarioLocal(7, tk)
    const hm = crearBorradorHomun('fin-de-semana'); hm.configuracion.fecha = '2026-11-30'; hm.generado = true; guardarItinerarioLocal(7, hm)
    guardarItinerarioLocal(8, { ...hm, configuracion: { ...hm.configuracion, fecha: '2026-12-24' } })
    montar('/mi-viaje')
    expect(screen.queryByText(/2026-12-24/)).not.toBeInTheDocument()
    for (const nombre of ['Homún', 'Izamal', 'Valladolid', 'Tekit']) {
      expect(await screen.findAllByRole('link', { name: `Abrir itinerario de ${nombre}` })).toHaveLength(1)
      await userEvent.click(screen.getByRole('link', { name: `Abrir itinerario de ${nombre}` }))
      expect(screen.getByRole('heading', { name: `Tu Itinerario en ${nombre}` })).toBeInTheDocument()
      await userEvent.click(screen.getByRole('link', { name: 'Ver mis itinerarios guardados' }))
    }
  })
  it('no anuncia éxito si falla el guardado en el servidor', async () => {
    autenticar()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ detail: 'No se pudo guardar' }), { status: 500 })))
    montar(`/rutas/homun/itinerario?${config}&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar')
    expect(screen.queryByText('Itinerario guardado en tu cuenta')).not.toBeInTheDocument()
  })
  it('conserva acciones y etiquetas de traslado cuando fallan imágenes originales', () => {
    const { container } = montar(`/rutas/homun/itinerario?${config}&generado=1`)
    expect(screen.getAllByRole('img')).toHaveLength(4)
    for (const img of screen.getAllByRole('img')) fireEvent.error(img)
    expect(screen.getAllByText('Imagen del prototipo no disponible')).toHaveLength(4)
    const visitas = screen.getByRole('list', { name: 'Recorrido del Día 1' })
    expect(within(visitas).getByText(/Mototaxi · 3 min estimados/)).toBeInTheDocument()
    expect(within(visitas).getByText(/Traslado entre senderos · 5 min estimados/)).toBeInTheDocument()
    expect(within(visitas).getByText(/Mototaxi · 4 min estimados/)).toBeInTheDocument()
    expect(within(visitas).getByText(/A pie · 2 min estimados/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar plan' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Personalizar' })).toBeInTheDocument()
    expect(container).not.toHaveTextContent(/Entrada \$50|Entrada \$40|Chaleco incluido|GPS activo|320m|3[.,]2 km|Salidas cada 25|Salida 2:30|Abrir vista en vivo|Convento San Bernardino|Mercado Municipal Bazar/)
  })
  it('cancelar compartir no copia ni anuncia éxito', async () => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue({ name: 'AbortError' }), clipboard: { writeText } })
    montar(`/rutas/homun/itinerario?${config}&generado=1`)
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }))
    expect(await screen.findByText(/Se canceló compartir/)).toHaveAttribute('role', 'status')
    expect(writeText).not.toHaveBeenCalled()
    expect(screen.queryByText('Vista previa compartida.')).not.toBeInTheDocument()
  })
  it('ofrece copia manual reproducible y comunica fallos de descarga', async () => {
    vi.spyOn(acciones, 'compartirHomun').mockResolvedValue({ estado: 'manual', mensaje: 'Copia este enlace manualmente.' })
    vi.spyOn(acciones, 'descargarHomun').mockImplementation(() => { throw new Error('Bloqueado') })
    montar(`/rutas/homun/itinerario?${finde}&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: 'Compartir' }))
    const enlace = await screen.findByLabelText('Enlace de la vista previa') as HTMLInputElement
    expect(calcularPlanHomun(leerBorradorHomun(new URL(enlace.value).searchParams)).plan!.jornadas).toHaveLength(2)
    expect(enlace.value).not.toMatch(/idUsuario|correo|token/)
    await userEvent.click(screen.getByRole('button', { name: 'Descargar plan' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo descargar')
    expect(screen.queryByText(/Se solicitó la descarga/)).not.toBeInTheDocument()
  })
  it('abre el detalle desde el mapa y mantiene Mi viaje protegido', async () => {
    const primera = montar(`/rutas/homun/itinerario?${config}&generado=1`)
    await userEvent.click(screen.getByRole('link', { name: 'Ver detalle de ruta' }))
    expect(primera.router.state.location.pathname).toBe('/rutas/homun')
    expect(screen.getByRole('radio', { name: /Medio día/ })).toBeChecked()
    primera.unmount()
    const segunda = montar('/mi-viaje')
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument()
    expect(segunda.router.state.location.state).toEqual({ desde: '/mi-viaje' })
  })
})
