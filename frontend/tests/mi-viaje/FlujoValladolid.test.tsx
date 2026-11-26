import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../src/types/auth'
import { router as routerAplicacion } from '../../src/app/router'
import { guardarItinerarioLocal } from '../../src/features/mi-viaje/storage/itinerariosLocales'
import { crearBorradorValladolid, leerBorradorValladolid, urlBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { leerBorradorIzamal } from '../../src/features/mi-viaje/plan/borradorIzamal'
import * as acciones from '../../src/features/mi-viaje/plan/accionesValladolid'

const sesion = vi.hoisted(() => ({ usuario: null as Usuario | null, cargando: false }))
vi.mock('../../src/features/auth/useAuth', () => ({
  useAuth: () => ({ usuario: sesion.usuario, cargando: sesion.cargando, tieneRol: () => false, cerrarSesion: vi.fn(), iniciarSesion: async () => { sesion.usuario = { idUsuario: 7, nombre: 'Ana', correo: 'ana@biin.test', roles: ['viajero'] } } }),
}))
const configuracion = 'estancia=medio-dia&fecha=2026-11-30&inicio=10%3A40&minutos=270&inicio2=09%3A00&minutos2=270'
const completo = configuracion.replace('estancia=medio-dia', 'estancia=dia-completo').replace('minutos=270', 'minutos=540')
const finSemana = configuracion.replace('estancia=medio-dia', 'estancia=fin-de-semana')
const routers: ReturnType<typeof createMemoryRouter>[] = []
function montar(url = '/rutas/valladolid/personalizar') {
  const router = createMemoryRouter(routerAplicacion.routes, { initialEntries: [url] })
  routers.push(router)
  return { router, ...render(<RouterProvider router={router} />) }
}
function iniciarSesion() { sesion.usuario = { idUsuario: 7, nombre: 'Ana', correo: 'ana@biin.test', roles: ['viajero'] } }
beforeEach(() => { sesion.usuario = null; sesion.cargando = false; localStorage.clear() })
afterEach(() => { routers.splice(0).forEach(r => r.dispose()); vi.restoreAllMocks(); vi.unstubAllGlobals() })
afterAll(() => routerAplicacion.dispose())

describe('Flujo de Valladolid CU-09 / RF09', () => {
  it.each([['Medio día', 'medio-dia', 270], ['Día completo', 'dia-completo', 540], ['Fin de semana', 'fin-de-semana', 270]] as const)('conserva %s desde el detalle, al personalizar y al volver', async (nombre, estancia, minutos) => {
    const { router } = montar('/rutas/valladolid')
    await userEvent.click(screen.getByRole('radio', { name: new RegExp(nombre) }))
    await userEvent.click(screen.getByRole('button', { name: 'Itinerario recomendado en Valladolid' }))
    expect(router.state.location.pathname).toBe('/rutas/valladolid/itinerario')
    expect(screen.getByLabelText('Horas del Día 1')).toHaveValue(minutos === null ? null : Math.floor(minutos / 60))
    expect(screen.getByLabelText('Minutos del Día 1')).toHaveValue(minutos === null ? null : minutos % 60)
    expect(screen.getByLabelText('Estancia')).toHaveValue(estancia)
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Personalizar' }))
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByLabelText('Estancia')).toHaveValue(estancia)
    await userEvent.click(screen.getByRole('link', { name: 'Volver a detalle de ruta' }))
    expect(screen.getByRole('radio', { name: new RegExp(nombre) })).toBeChecked()
  })

  it.each(['itinerario', 'personalizar', 'itinerario/', 'personalizar/'])('abre directamente %s con navegación única, Rutas activa y sin resultado inicial', ruta => {
    const { container } = montar(`/rutas/valladolid/${ruta}`)
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(1)
    expect(within(nav).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
    expect(container.querySelector('.biin-cabecera-simple')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Horas del Día 1')).toHaveValue(4)
    expect(screen.getByLabelText('Minutos del Día 1')).toHaveValue(30)
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
  })

  it('comienza personalizado sin lugares y exige configuración y selección', async () => {
    montar()
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').every(c => !(c as HTMLInputElement).checked)).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('fecha válida')
    fireEvent.change(screen.getByLabelText('Fecha de visita'), { target: { value: '2026-11-30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('selecciona al menos un lugar')
  })

  it('selecciona por teclado, conserva filtros, actualiza contadores y restablece el resultado', async () => {
    const { router } = montar(`/rutas/valladolid/personalizar?${configuracion}`)
    const user = userEvent.setup()
    const mercado = screen.getByRole('checkbox', { name: 'Mercado Municipal Donato Bates' })
    mercado.focus()
    await user.keyboard(' ')
    expect(mercado).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Cenotes/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Cenote Zací y Parque Principal' }))
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gastronomía.*1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cenotes.*1/ })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Resumen del Día 1' })).toHaveTextContent('2 h 15 min de visitas + 11 min de desplazamientos')
    await user.click(screen.getByRole('button', { name: /Gastronomía/ }))
    expect(screen.getByRole('checkbox', { name: 'Mercado Municipal Donato Bates' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Personalizar' }))
    expect(screen.getByRole('checkbox', { name: 'Mercado Municipal Donato Bates' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Restablecer selección' }))
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    const parametros = new URLSearchParams(router.state.location.search)
    expect(parametros.has('dia1')).toBe(false)
    expect(parametros.has('dia2')).toBe(false)
    expect(parametros.has('generado')).toBe(false)
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
  })

  it('asigna visitas a cada jornada y genera fechas consecutivas, sin repetir lugares', async () => {
    montar(`/rutas/valladolid/personalizar?${finSemana}`)
    const user = userEvent.setup()
    expect(screen.getByLabelText(/Fecha del Día 2/)).toHaveValue('2026-12-01')
    await user.click(screen.getByRole('checkbox', { name: 'Mercado Municipal Donato Bates' }))
    await user.selectOptions(screen.getByRole('combobox', { name: /Jornada de Mercado Municipal/ }), '2')
    await user.click(screen.getByRole('button', { name: /Cenotes/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Cenote Zací y Parque Principal' }))
    expect(screen.getByRole('status', { name: 'Resumen del Día 1' })).toHaveTextContent('1 h de visitas')
    expect(screen.getByRole('status', { name: 'Resumen del Día 2' })).toHaveTextContent('1 h 15 min de visitas')
    await user.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    const dia1 = screen.getByRole('region', { name: 'Día 1 · 2026-11-30' })
    const dia2 = screen.getByRole('region', { name: 'Día 2 · 2026-12-01' })
    expect(within(dia1).getByRole('heading', { name: 'Cenote Zací y Parque Principal' })).toBeInTheDocument()
    expect(within(dia1).queryByRole('heading', { name: 'Mercado Municipal Donato Bates' })).not.toBeInTheDocument()
    expect(within(dia2).getByRole('heading', { name: 'Mercado Municipal Donato Bates' })).toBeInTheDocument()
    expect(screen.getAllByText(/Margen final para preparar el regreso: 15 min/)).toHaveLength(2)
  })

  it('rechaza un exceso del primer día, aunque el segundo tenga tiempo, sin borrar la selección', async () => {
    montar(`/rutas/valladolid/personalizar?${finSemana}&dia1=zaci,mercado-donato,calzada-frailes&dia2=san-bernardino`)
    fireEvent.change(screen.getByLabelText('Horas del Día 1'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Minutos del Día 1'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Horas del Día 2'), { target: { value: '9' } })
    fireEvent.change(screen.getByLabelText('Minutos del Día 2'), { target: { value: '0' } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Día 1: la selección excede el tiempo disponible por 1 h 52 min')
    expect(screen.getByText('4 lugares seleccionados')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Mercado Municipal Donato Bates' })).toBeChecked()
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
  })

  it('restablece las dos jornadas y elimina cualquier resultado previo conservando la configuración', async () => {
    const { router } = montar(`/rutas/valladolid/personalizar?${finSemana}&dia1=zaci&dia2=mercado-donato&generado=1`)
    expect(screen.getByText('2 lugares seleccionados')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reiniciar selección' }))
    expect(screen.getByText('0 lugares seleccionados')).toBeInTheDocument()
    const parametros = new URLSearchParams(router.state.location.search)
    expect(parametros.has('dia1')).toBe(false)
    expect(parametros.has('dia2')).toBe(false)
    expect(parametros.has('generado')).toBe(false)
    expect(screen.getByLabelText(/Fecha del Día 2/)).toHaveValue('2026-12-01')
    await userEvent.click(screen.getByRole('button', { name: 'Generar mi itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Día 1: selecciona al menos un lugar')
    expect(screen.getByRole('alert')).toHaveTextContent('Día 2: selecciona al menos un lugar')
  })

  it.each([
    ['Hora de inicio del Día 1', '', 'hora de inicio válida'],
    ['Horas del Día 1', '1.5', 'número entero'],
    ['Hora de inicio del Día 1', '23:00', 'sin visitas nocturnas'],
  ])('valida %s antes de generar y guardar', async (campo, valor, error) => {
    montar(`/rutas/valladolid/itinerario?${configuracion}`)
    fireEvent.change(screen.getByLabelText(campo), { target: { value: valor } })
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getByRole('alert')).toHaveTextContent(error)
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
  })

  it('explica parámetros manipulados o incompletos aunque pidan un resultado generado', () => {
    montar('/rutas/valladolid/itinerario?estancia=fin-de-semana&fecha=2026-02-30&inicio=25:00&minutos=2880&modo=otro&dia1=kinich&generado=1')
    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('fecha válida')
    expect(alerta).toHaveTextContent('Día 2:')
    expect(alerta).toHaveTextContent('modo válido')
    expect(alerta).toHaveTextContent('lugares desconocidos')
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
  })

  it('genera, conserva al recargar y alterna modos; editar invalida el plan anterior', async () => {
    const primera = montar(`/rutas/valladolid/itinerario?${finSemana}`)
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    const url = primera.router.state.location.pathname + primera.router.state.location.search
    primera.unmount()
    montar(url)
    expect(screen.getByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Personalizado' }))
    expect(screen.getByText('4 lugares seleccionados')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Recomendado' }))
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Generar itinerario recomendado' }))
    fireEvent.change(screen.getByLabelText('Hora de inicio del Día 2'), { target: { value: '10:00' } })
    expect(screen.queryByRole('heading', { name: 'Paso a paso a pie' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar itinerario' })).toBeDisabled()
    await userEvent.click(screen.getByRole('link', { name: 'Volver a detalle de ruta' }))
    await userEvent.click(screen.getByRole('button', { name: 'Itinerario recomendado en Valladolid' }))
    expect(screen.getByLabelText('Hora de inicio del Día 2')).toHaveValue('10:00')
  })

  it('los filtros del resultado conservan el plan completo, su URL y el guardado', async () => {
    iniciarSesion()
    const { router } = montar(`/rutas/valladolid/itinerario?${completo}&generado=1`)
    const consulta = router.state.location.search
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(4)
    await userEvent.click(screen.getByRole('button', { name: 'Gastronomía' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(1)
    expect(screen.queryByRole('heading', { name: 'Ex Convento de San Bernardino de Siena' })).not.toBeInTheDocument()
    expect(router.state.location.search).toBe(consulta)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    const [item] = await (await fetch('/api/itinerarios')).json() as { destino: string; borrador: { seleccion: unknown[]; configuracion: { minutosDisponibles: string } } }[]
    expect(item.destino).toBe('valladolid')
    if (item.destino === 'valladolid') {
      expect(item.borrador.seleccion).toHaveLength(4)
      const abierto = leerBorradorValladolid(new URL(urlBorradorValladolid('itinerario', item.borrador), 'https://biin.test').searchParams)
      expect(abierto.configuracion.minutosDisponibles).toBe('540')
    }
    await userEvent.click(screen.getByRole('button', { name: 'Ruta Sugerida' }))
    expect(screen.getAllByText(/Visita estimada:/)).toHaveLength(4)
  })

  it('pide acceso para guardar, recupera el borrador y evita duplicados en Mi viaje', async () => {
    const { router } = montar(`/rutas/valladolid/itinerario?${finSemana}&generado=1`)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state.desde).toContain('/rutas/valladolid/itinerario?')
    expect(localStorage.length).toBe(0)
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@biin.test')
    await user.type(screen.getByLabelText('Contraseña'), 'ejemplo')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: 'Paso a paso a pie' })).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de visita')).toHaveValue('2026-11-30')
    expect(screen.getByLabelText(/Fecha del Día 2/)).toHaveValue('2026-12-01')
    await user.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(await screen.findByText('Itinerario guardado en tu cuenta')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Ver mis itinerarios guardados' }))
    expect(await screen.findAllByRole('link', { name: 'Abrir itinerario de Valladolid' })).toHaveLength(1)
    await user.click(screen.getByRole('link', { name: 'Abrir itinerario de Valladolid' }))
    expect(screen.getByRole('heading', { name: 'Día 2 · 2026-12-01' })).toBeInTheDocument()
  })

  it('lista y abre Valladolid e Izamal antiguo con enlaces propios, sin mezclar cuentas', async () => {
    iniciarSesion()
    const izamal = leerBorradorIzamal(new URLSearchParams('estancia=medio-dia&fecha=2026-11-30&inicio=11:30&minutos=240&generado=1'))
    localStorage.setItem('biin:itinerarios:v1:7', JSON.stringify({ version: 1, itinerarios: [{ id: 'izamal:antiguo', guardadoEn: '2026-11-20T12:00:00Z', borrador: izamal }] }))
    const b = crearBorradorValladolid()
    b.configuracion.fecha = '2026-11-30'
    b.generado = true
    guardarItinerarioLocal(7, b)
    guardarItinerarioLocal(8, b)
    montar('/mi-viaje')
    expect(await screen.findAllByRole('link', { name: 'Abrir itinerario de Izamal' })).toHaveLength(1)
    expect(await screen.findAllByRole('link', { name: 'Abrir itinerario de Valladolid' })).toHaveLength(1)
    await userEvent.click(screen.getByRole('link', { name: 'Abrir itinerario de Izamal' }))
    expect(screen.getByRole('heading', { name: 'Tu Itinerario en Izamal' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Ver mis itinerarios guardados' }))
    await userEvent.click(screen.getByRole('link', { name: 'Abrir itinerario de Valladolid' }))
    expect(screen.getByRole('heading', { name: 'Tu Itinerario en Valladolid' })).toBeInTheDocument()
  })

  it('no anuncia guardado cuando falla la escritura', async () => {
    iniciarSesion()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ detail: 'No se pudo guardar' }), { status: 500 })))
    montar(`/rutas/valladolid/itinerario?${configuracion}&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar itinerario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar')
    expect(screen.queryByText('Itinerario guardado en tu cuenta')).not.toBeInTheDocument()
  })

  it('ofrece el enlace reproducible si compartir falla y comunica fallos de descarga', async () => {
    vi.spyOn(acciones, 'compartirValladolid').mockResolvedValue({ estado: 'manual', mensaje: 'No se pudo compartir ni copiar automáticamente. Copia el enlace.' })
    vi.spyOn(acciones, 'descargarValladolid').mockImplementation(() => { throw new Error('Descarga bloqueada') })
    montar(`/rutas/valladolid/itinerario?${configuracion}&generado=1`)
    await userEvent.click(screen.getByRole('button', { name: 'Compartir' }))
    const enlace = await screen.findByLabelText('Enlace de la vista previa') as HTMLInputElement
    expect(enlace.value).toContain('/rutas/valladolid/itinerario?')
    expect(screen.queryByText('Enlace de la vista previa copiado.')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Descargar plan' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo descargar')
    expect(screen.queryByText(/Se solicitó la descarga/)).not.toBeInTheDocument()
  })

  it('mantiene las acciones cuando fallan las imágenes y no simula servicios', () => {
    const { container } = montar(`/rutas/valladolid/itinerario?${completo}&generado=1`)
    for (const imagen of screen.getAllByRole('img')) fireEvent.error(imagen)
    expect(screen.getAllByText('Imagen no disponible')).toHaveLength(4)
    expect(screen.getByRole('link', { name: 'Personalizar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver detalle de ruta' })).toBeInTheDocument()
    expect(container).not.toHaveTextContent(/Apartando asiento|Abrir vista en vivo|Acceso libre|Entrada \$30|marcadas con GPS|salidas frecuentes cada|2[.,]4 km totales/i)
  })

  it('mantiene /mi-viaje protegido y su retorno de acceso', async () => {
    const { router } = montar('/mi-viaje')
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state).toEqual({ desde: '/mi-viaje' })
  })
})
