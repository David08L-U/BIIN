import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../src/types/auth'
import { router as routerAplicacion } from '../../src/app/router'
import { guardarItinerarioLocal, leerItinerariosLocales } from '../../src/features/mi-viaje/storage/itinerariosLocales'
import { crearBorradorTicul, leerBorradorTicul } from '../../src/features/mi-viaje/plan/borradorTicul'
import { crearBorradorHomun } from '../../src/features/mi-viaje/plan/borradorHomun'
import { crearBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { crearBorradorTekit } from '../../src/features/mi-viaje/plan/borradorTekit'
import { leerBorradorIzamal } from '../../src/features/mi-viaje/plan/borradorIzamal'
import { calcularPlanTicul } from '../../src/features/mi-viaje/plan/itinerarioTicul'
import * as acciones from '../../src/features/mi-viaje/plan/accionesTicul'

const sesion = vi.hoisted(() => ({ usuario: null as Usuario | null, cargando: false }))
vi.mock('../../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: sesion.usuario, cargando: sesion.cargando, tieneRol: () => false, cerrarSesion: vi.fn(), iniciarSesion: async () => { sesion.usuario = { idUsuario: 7, nombre: 'Ana', correo: 'ana@biin.test', roles: ['viajero'] } } }),
}))
const config = 'estancia=medio-dia&fecha=2026-11-30&inicio=09%3A00&minutos=240'
const amplio = config.replace('minutos=240', 'minutos=300')
const todas = 'talleres-alfareros,corredor-calzado,comida-mercado,iglesia-san-antonio'
const routers: ReturnType<typeof createMemoryRouter>[] = []
function montar(url = '/rutas/ticul/personalizar') {
  const router = createMemoryRouter(routerAplicacion.routes, { initialEntries: [url] })
  routers.push(router)
  return { router, ...render(<RouterProvider router={router} />) }
}
function autenticar() { sesion.usuario = { idUsuario: 7, nombre: 'Ana', correo: 'ana@biin.test', roles: ['viajero'] } }
beforeEach(() => { sesion.usuario = null; sesion.cargando = false; localStorage.clear() })
afterEach(() => { routers.splice(0).forEach(r => r.dispose()); vi.restoreAllMocks(); vi.unstubAllGlobals() })
afterAll(() => routerAplicacion.dispose())

describe('Flujo de Ticul CU-09 / RF09', () => {
  it.each(['itinerario', 'itinerario/', 'personalizar', 'personalizar/'])('abre %s con una sola navegación y Rutas activa', ruta => {
    const { container } = montar('/rutas/ticul/' + ruta)
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(1)
    expect(within(nav).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
    expect(container.querySelector('.biin-cabecera-simple')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Tiempo disponible (minutos)')).toHaveValue(240)
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie & mototaxi' })).not.toBeInTheDocument()
  })
  it('comienza personalizado vacío y valida fecha y selección antes de generar', async () => {
    montar()
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').every(c => !(c as HTMLInputElement).checked)).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('fecha válida')
    fireEvent.change(screen.getByLabelText('Fecha de visita'), { target: { value: '2026-11-30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona al menos un lugar')
    expect(localStorage.length).toBe(0)
  })
  it('selecciona con teclado y conserva categorías, contadores y tiempos reales', async () => {
    montar('/rutas/ticul/personalizar?' + config)
    const taller = screen.getByRole('checkbox', { name: 'Barrio de San Enrique y Talleres Alfareros' })
    taller.focus(); await userEvent.keyboard(' ')
    expect(taller).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: /Gastronomía/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Poc Chuc Ticuleño y Panuchos de Pavo' }))
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Alfarería & Zapaterías.*1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gastronomía.*1/ })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Resumen de selección' })).toHaveTextContent('120 min de visitas + 10 min de traslados con regreso + 15 min de margen')
    expect(screen.getByRole('status', { name: 'Resumen de selección' })).toHaveTextContent('Tiempo libre: 95 min')
    await userEvent.click(screen.getByRole('button', { name: /Alfarería & Zapaterías/ }))
    expect(screen.getByRole('checkbox', { name: 'Barrio de San Enrique y Talleres Alfareros' })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(2)
  })
  it.each(['Restablecer selección', 'Reiniciar selección'])('%s limpia selección y resultado conservando configuración', async nombre => {
    const { router } = montar('/rutas/ticul/personalizar?' + amplio + '&modo=personalizado&lugares=' + todas + '&generado=1')
    await userEvent.click(screen.getByRole('button', { name: nombre }))
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    const p = new URLSearchParams(router.state.location.search)
    expect(p.has('lugares')).toBe(false); expect(p.has('generado')).toBe(false)
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
    expect(screen.getByLabelText('Hora de inicio')).toHaveValue('09:00')
    expect(screen.getByLabelText('Tiempo disponible (minutos)')).toHaveValue(300)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona al menos un lugar')
  })
  it('explica los 2 minutos de exceso sin recortar visitas, margen ni selección', async () => {
    const { router } = montar('/rutas/ticul/personalizar?' + config + '&modo=personalizado&lugares=' + todas)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('excede el tiempo disponible por 2 minutos')
    expect(screen.getByText('4 lugares seleccionados')).toBeInTheDocument()
    expect(new URLSearchParams(router.state.location.search).get('lugares')).toBe(todas)
    expect(localStorage.length).toBe(0)
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie & mototaxi' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Tiempo disponible (minutos)'), { target: { value: '242' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(4)
    expect(screen.getByText(/4 h 02 min estimadas/)).toBeInTheDocument()
  })
  it.each(['dia-completo', 'tour-compras'])('%s solicita minutos sin duración inventada y limita el recomendado a Ticul', async modalidad => {
    montar('/rutas/ticul/itinerario?' + config)
    await userEvent.selectOptions(screen.getByLabelText('Estancia o modalidad'), modalidad)
    expect(screen.getByLabelText('Tiempo disponible (minutos)')).toHaveValue(null)
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getByRole('alert')).toHaveTextContent('no tiene duración fija')
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Tiempo disponible (minutos)'), { target: { value: '300' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(modalidad === 'tour-compras' ? 2 : 4)
    if (modalidad === 'tour-compras') {
      expect(screen.queryByRole('heading', { name: 'Poc Chuc Ticuleño y Panuchos de Pavo' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Ex Convento e Iglesia de San Antonio de Padua' })).not.toBeInTheDocument()
      expect(screen.getByText(/2 h 26 min estimadas/)).toBeInTheDocument()
    } else expect(screen.getByText(/esta propuesta incluye solo las referencias de Ticul, sin excursiones/)).toBeInTheDocument()
  })
  it.each([
    ['Fecha de visita', '', 'fecha válida'], ['Hora de inicio', '25:00', 'hora de inicio válida'],
    ['Tiempo disponible (minutos)', '12.5', 'número entero'], ['Tiempo disponible (minutos)', '721', 'número entero'],
  ])('valida %s antes de generar', async (campo, valor, mensaje) => {
    montar('/rutas/ticul/itinerario?' + config)
    fireEvent.change(screen.getByLabelText(campo), { target: { value: valor } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getByRole('alert')).toHaveTextContent(mensaje)
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie & mototaxi' })).not.toBeInTheDocument()
  })
  it.each([
    'estancia=otra&fecha=2026-02-30&inicio=25:00&modo=otro&lugares=zaci&generado=1',
    'fecha=2026-11-30&generado=1', config + '&modo=otro&generado=1', config + '&destino=homun&generado=1',
    config + '&minutos=360&generado=1', config + '&lugares=corredor-calzado&lugares=comida-mercado&generado=1',
  ])('rechaza parámetros incompletos o manipulados: %s', p => {
    montar('/rutas/ticul/itinerario?' + p)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie & mototaxi' })).not.toBeInTheDocument()
  })
  it('recarga un resultado real; editar configuración lo invalida y conserva la opción al volver', async () => {
    const primera = montar('/rutas/ticul/itinerario?' + config)
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(3)
    expect(screen.getByText(/3 h 30 min estimadas/)).toBeInTheDocument()
    expect(screen.getByText(/4 h 00 min disponibles/)).toBeInTheDocument()
    const url = primera.router.state.location.pathname + primera.router.state.location.search
    primera.unmount()
    montar(url)
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(3)
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '10:00' } })
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie & mototaxi' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    await userEvent.click(screen.getByRole('link', { name: 'Volver a detalle de ruta' }))
    expect(screen.getByRole('radio', { name: 'Medio día (3–4 horas)' })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Hacer mi itinerario en Ticul' }))
    expect(screen.getByLabelText('Hora de inicio')).toHaveValue('10:00')
  })
  it('conserva selección y configuración al personalizar, alternar y navegar atrás/adelante', async () => {
    const { router } = montar('/rutas/ticul/itinerario?' + config + '&generado=1')
    await userEvent.click(screen.getByRole('link', { name: 'Personalizado' }))
    expect(screen.getByText('3 lugares seleccionados')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Barrio de San Enrique y Talleres Alfareros' }))
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    expect(new URLSearchParams(router.state.location.search).has('generado')).toBe(false)
    await act(async () => { await router.navigate(-1) })
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(3)
    await act(async () => { await router.navigate(1) })
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Recomendado' }))
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie & mototaxi' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
  })
  it('editar selección invalida el resultado anterior en el borrador', async () => {
    const { router } = montar('/rutas/ticul/personalizar?' + amplio + '&modo=personalizado&lugares=' + todas + '&generado=1')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Corredor del Calzado Artesanal' }))
    expect(screen.getByText('3 lugares seleccionados')).toBeInTheDocument()
    expect(new URLSearchParams(router.state.location.search).has('generado')).toBe(false)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(3)
    expect(screen.queryByRole('heading', { name: 'Corredor del Calzado Artesanal' })).not.toBeInTheDocument()
  })
  it('los filtros del resultado no alteran la URL, guardado ni descarga del plan completo', async () => {
    autenticar()
    const descarga = vi.spyOn(acciones, 'descargarTicul').mockImplementation(() => {})
    const { router } = montar('/rutas/ticul/itinerario?' + amplio + '&generado=1')
    const consulta = router.state.location.search
    await userEvent.click(screen.getByRole('button', { name: 'Gastronomía' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(1)
    expect(router.state.location.search).toBe(consulta)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(leerItinerariosLocales(7).itinerarios[0].borrador.seleccion).toHaveLength(4)
    await userEvent.click(screen.getByRole('button', { name: 'Descargar plan' }))
    expect(descarga.mock.calls[0][1].seleccion).toHaveLength(4)
    await userEvent.click(screen.getByRole('button', { name: 'Alfarería & Zapaterías' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Ruta Sugerida' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(4)
  })
  it('recupera modalidad/configuración/selección tras el acceso y guarda sin duplicar en Mi viaje', async () => {
    const consulta = amplio.replace('estancia=medio-dia', 'estancia=tour-compras') + '&modo=personalizado&lugares=corredor-calzado,comida-mercado&generado=1'
    const { router } = montar('/rutas/ticul/itinerario?' + consulta)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state.desde).toContain('/rutas/ticul/itinerario?')
    expect(localStorage.length).toBe(0)
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@biin.test')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'ejemplo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: 'Paso a paso a pie & mototaxi' })).toBeInTheDocument()
    expect(screen.getByLabelText('Estancia o modalidad')).toHaveValue('tour-compras')
    expect(screen.getByLabelText('Tiempo disponible (minutos)')).toHaveValue(300)
    expect(leerBorradorTicul(new URLSearchParams(router.state.location.search)).seleccion).toEqual(['corredor-calzado', 'comida-mercado'])
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(screen.getByText('Guardado en este navegador')).toHaveAttribute('role', 'status')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar en Mi viaje' }))
    await userEvent.click(screen.getByRole('link', { name: 'Ver mis itinerarios guardados' }))
    expect(screen.getAllByRole('link', { name: 'Abrir itinerario de Ticul' })).toHaveLength(1)
    await userEvent.click(screen.getByRole('link', { name: 'Abrir itinerario de Ticul' }))
    expect(screen.getByRole('heading', { name: 'Tu Itinerario en Ticul' })).toBeInTheDocument()
  })
  it('lista y abre los cinco destinos con enlaces propios, sin mezclar cuentas', async () => {
    autenticar()
    const iz = leerBorradorIzamal(new URLSearchParams('estancia=medio-dia&fecha=2026-11-30&inicio=11:30&minutos=240&generado=1'))
    localStorage.setItem('biin:itinerarios:v1:7', JSON.stringify({ version: 1, itinerarios: [{ id: 'izamal:antiguo', guardadoEn: '2026-11-20T12:00:00Z', borrador: iz }] }))
    const va = crearBorradorValladolid('fin-de-semana'); va.configuracion.fecha = '2026-11-30'; va.generado = true; guardarItinerarioLocal(7, va)
    const tk = crearBorradorTekit('ruta-textil'); tk.configuracion.fecha = '2026-11-30'; tk.configuracion.minutosDisponibles = '180'; tk.generado = true; guardarItinerarioLocal(7, tk)
    const hm = crearBorradorHomun('fin-de-semana'); hm.configuracion.fecha = '2026-11-30'; hm.generado = true; guardarItinerarioLocal(7, hm)
    const ti = crearBorradorTicul(); ti.configuracion.fecha = '2026-11-30'; ti.generado = true; guardarItinerarioLocal(7, ti)
    guardarItinerarioLocal(8, { ...ti, configuracion: { ...ti.configuracion, fecha: '2026-12-24' } })
    montar('/mi-viaje')
    expect(screen.queryByText(/2026-12-24/)).not.toBeInTheDocument()
    for (const nombre of ['Ticul', 'Homún', 'Izamal', 'Valladolid', 'Tekit']) {
      expect(screen.getAllByRole('link', { name: 'Abrir itinerario de ' + nombre })).toHaveLength(1)
      await userEvent.click(screen.getByRole('link', { name: 'Abrir itinerario de ' + nombre }))
      expect(screen.getByRole('heading', { name: 'Tu Itinerario en ' + nombre })).toBeInTheDocument()
      await userEvent.click(screen.getByRole('link', { name: 'Ver mis itinerarios guardados' }))
    }
  })
  it.each(['escritura', 'lectura'])('no anuncia éxito si falla la %s del almacenamiento', async tipo => {
    autenticar()
    if (tipo === 'escritura') vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
    else vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    montar('/rutas/ticul/itinerario?' + config + '&generado=1')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent(tipo === 'escritura' ? 'No se pudo guardar' : 'No se pudieron leer')
    expect(screen.queryByText('Guardado en este navegador')).not.toBeInTheDocument()
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(3)
  })
  it('mantiene cronología, tipos de traslado y acciones si fallan las cinco imágenes originales', () => {
    const { container } = montar('/rutas/ticul/itinerario?' + amplio + '&generado=1')
    expect(screen.getAllByRole('img')).toHaveLength(5)
    for (const img of screen.getAllByRole('img')) fireEvent.error(img)
    expect(screen.getAllByText('Imagen del prototipo no disponible')).toHaveLength(5)
    const visitas = screen.getByRole('list', { name: 'Recorrido de Ticul' })
    expect(within(visitas).getByText(/Mototaxi · 3 min estimados/)).toBeInTheDocument()
    expect(within(visitas).getByText(/A pie · 5 min estimados/)).toBeInTheDocument()
    expect(within(visitas).getByText(/A pie · 4 min estimados/)).toHaveTextContent('(supuesto)')
    expect(within(visitas).getByText(/A pie · 2 min estimados/)).toBeInTheDocument()
    expect(container.querySelectorAll('.ti-marcador')).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Descargar plan' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Personalizar' })).toBeInTheDocument()
    expect(container).not.toHaveTextContent(/GPS activo|2[.,]1 km|Salidas cada|Salida 15:30|Llegada 11:30|Abrir vista en vivo|HTML|Entrada gratis/)
  })
  it('cancelar compartir no copia ni anuncia éxito', async () => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue({ name: 'AbortError' }), clipboard: { writeText } })
    montar('/rutas/ticul/itinerario?' + config + '&generado=1')
    fireEvent.click(screen.getByRole('button', { name: 'Compartir itinerario' }))
    expect(await screen.findByText(/Se canceló compartir/)).toHaveAttribute('role', 'status')
    expect(writeText).not.toHaveBeenCalled()
    expect(screen.queryByText('Vista previa compartida.')).not.toBeInTheDocument()
  })
  it('ofrece copia manual reproducible y comunica fallos de descarga', async () => {
    vi.spyOn(acciones, 'compartirTicul').mockResolvedValue({ estado: 'manual', mensaje: 'Copia este enlace manualmente.' })
    vi.spyOn(acciones, 'descargarTicul').mockImplementation(() => { throw new Error('Bloqueado') })
    montar('/rutas/ticul/itinerario?' + amplio + '&generado=1')
    await userEvent.click(screen.getByRole('button', { name: 'Compartir itinerario' }))
    const enlace = await screen.findByLabelText('Enlace de la vista previa') as HTMLInputElement
    expect(enlace).toHaveAttribute('readonly')
    expect(calcularPlanTicul(leerBorradorTicul(new URL(enlace.value).searchParams)).plan!.seleccion).toHaveLength(4)
    expect(enlace.value).not.toMatch(/idUsuario|correo|token/)
    await userEvent.click(screen.getByRole('button', { name: 'Descargar plan' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo descargar')
    expect(screen.queryByText(/Se solicitó la descarga/)).not.toBeInTheDocument()
  })
  it('abre el detalle desde el mapa y mantiene Mi viaje protegido', async () => {
    const primera = montar('/rutas/ticul/itinerario?' + config + '&generado=1')
    await userEvent.click(screen.getByRole('link', { name: 'Ver detalle de ruta' }))
    expect(primera.router.state.location.pathname).toBe('/rutas/ticul')
    expect(screen.getByRole('radio', { name: 'Medio día (3–4 horas)' })).toBeChecked()
    primera.unmount()
    const segunda = montar('/mi-viaje')
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(segunda.router.state.location.state).toEqual({ desde: '/mi-viaje' })
  })
})
