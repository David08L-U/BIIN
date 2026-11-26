import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Layout from '../src/components/layout/Layout'
import RutaProtegida from '../src/features/auth/RutaProtegida'
import { AuthContext, type AuthContextValor } from '../src/features/auth/authContextValor'
import PerfilPage from '../src/features/perfil/pages/PerfilPage'
import VistaPreviaPerfilPage from '../src/features/perfil/pages/VistaPreviaPerfilPage'
import { type ItinerarioGuardado } from '../src/features/mi-viaje/storage/itinerariosLocales'
import type { BorradorIzamal } from '../src/features/mi-viaje/plan/itinerarioIzamal'
import MiViajePage from '../src/features/mi-viaje/pages/MiViajePage'
import ElegirItinerarioPage from '../src/features/explorar/pages/ElegirItinerarioPage'
import { sembrarItinerariosServidorPrueba } from './setup'

const borrador: BorradorIzamal = { configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '11:30', minutosDisponibles: '240' }, modo: 'personalizado', seleccion: ['convento', 'kinich'], generado: true }
const izamal: ItinerarioGuardado = { id: 'izamal-ejemplo', guardadoEn: '2026-11-25T10:00:00Z', borrador }
const muestras: [string, ItinerarioGuardado][] = [
  ['Izamal', izamal],
  ['Valladolid', { destino: 'valladolid', id: 'valladolid-ejemplo', guardadoEn: izamal.guardadoEn, borrador: {
    destino: 'valladolid', configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '10:40', minutosDisponibles: '270', horaInicioDia2: '09:00', minutosDia2: '270' }, modo: 'personalizado', seleccion: [{ lugarId: 'zaci', dia: 1 }], generado: true,
  } }],
  ['Tekit', { destino: 'tekit', id: 'tekit-ejemplo', guardadoEn: izamal.guardadoEn, borrador: {
    destino: 'tekit', configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '10:20', minutosDisponibles: '240' }, modo: 'personalizado', seleccion: ['corredor-textil'], generado: true,
  } }],
  ['Homún', { destino: 'homun', id: 'homun-ejemplo', guardadoEn: izamal.guardadoEn, borrador: {
    destino: 'homun', configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '09:55', minutosDisponibles: '270', horaInicioDia2: '09:00', minutosDia2: '270' }, modo: 'personalizado', seleccion: [{ lugarId: 'santa-rosa', dia: 1 }], generado: true,
  } }],
  ['Ticul', { destino: 'ticul', id: 'ticul-ejemplo', guardadoEn: izamal.guardadoEn, borrador: {
    destino: 'ticul', configuracion: { estancia: 'medio-dia', fecha: '2026-11-30', horaInicio: '11:30', minutosDisponibles: '240' }, modo: 'personalizado', seleccion: ['corredor-calzado'], generado: true,
  } }],
]

function sembrar(idUsuario: number, itinerarios: ItinerarioGuardado[]) {
  localStorage.setItem(`biin:itinerarios:v1:${idUsuario}`, JSON.stringify({ version: 1, itinerarios }))
  if (idUsuario === 7) sembrarItinerariosServidorPrueba(itinerarios.map(item => ({ destino: item.destino, borrador: item.borrador, guardadoEn: item.guardadoEn })))
}

function montar(opciones: { sesion?: boolean; cargando?: boolean; previa?: boolean; nombre?: string; correo?: string; ruta?: string } = {}) {
  const usuario = opciones.sesion === false ? null : { idUsuario: 7, nombre: opciones.nombre ?? 'Ana López', correo: opciones.correo ?? 'ana@ejemplo.com', roles: ['viajero' as const] }
  const contexto: AuthContextValor = {
    usuario, cargando: opciones.cargando ?? false,
    iniciarSesion: vi.fn(async () => {}), registrarse: vi.fn(async () => {}),
    cerrarSesion: vi.fn(), tieneRol: rol => usuario?.roles.some(r => r === rol) ?? false,
  }
  const router = createMemoryRouter([{
    element: <Layout />, children: [
      { path: '/vista-previa/perfil', element: <VistaPreviaPerfilPage /> },
      { element: <RutaProtegida />, children: [{ path: '/perfil', element: <PerfilPage /> }] },
      { path: '/login', element: <h1>Acceso de prueba</h1> },
      { path: '/', element: <h1>Inicio de prueba</h1> },
      { path: '/recorridos', element: <ElegirItinerarioPage /> },
      { element: <RutaProtegida />, children: [{ path: '/mi-viaje', element: <MiViajePage /> }] },
      { path: '/rutas/:destino/itinerario', element: <h1>Plan abierto</h1> },
    ],
  }], { initialEntries: [opciones.ruta ?? (opciones.previa ? '/vista-previa/perfil' : '/perfil')] })
  const resultado = render(<AuthContext.Provider value={contexto}><RouterProvider router={router} /></AuthContext.Provider>)
  return { ...resultado, router, contexto }
}

beforeEach(() => localStorage.clear())
afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

describe('Perfil del prototipo CU-01 / CU-09 / RNF06', () => {
  it('muestra la identidad actual sin inventar verificación ni viajes', async () => {
    montar()
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ana López' })).toBeInTheDocument()
    expect(screen.getByText('ana@ejemplo.com')).toBeInTheDocument()
    expect(screen.getByText('Teléfono no disponible')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Sin datos disponibles')).toHaveLength(3)
    expect(screen.queryByText(/usuario verificado/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Izamal Express/)).not.toBeInTheDocument()
    expect(await screen.findByText(/No hay itinerarios guardados para esta cuenta/)).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(nav).getByRole('link', { name: 'Perfil' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getAllByRole('link')).toHaveLength(5)
  })

  it('mantiene Perfil protegido y conserva su destino al pedir acceso', async () => {
    const { router } = montar({ sesion: false })
    expect(await screen.findByRole('heading', { name: 'Acceso de prueba' })).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ desde: '/perfil' })
    expect(screen.queryByText('ana@ejemplo.com')).not.toBeInTheDocument()
  })

  it('espera a recuperar la sesión antes de mostrar datos personales', () => {
    montar({ sesion: false, cargando: true })
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Mi perfil' })).not.toBeInTheDocument()
  })

  it.each(muestras)('abre el itinerario guardado de %s con su configuración', async (nombre, item) => {
    sembrar(7, [item])
    const { router } = montar()
    await userEvent.click(await screen.findByRole('link', { name: `Ver ruta de ${nombre}` }))
    expect(await screen.findByRole('heading', { name: 'Plan abierto' })).toBeInTheDocument()
    const destino = item.destino ?? 'izamal'
    expect(router.state.location.pathname).toBe(`/rutas/${destino}/itinerario`)
    const parametros = new URLSearchParams(router.state.location.search)
    expect(parametros.get('generado')).toBe('1')
    expect(parametros.get('fecha')).toBe(item.borrador.configuracion.fecha)
    expect(parametros.get('modo')).toBe(item.borrador.modo)
  })

  it('abre Mi viaje con los cinco destinos guardados y activa su navegación', async () => {
    sembrar(7, [izamal, muestras[1][1], muestras[2][1], muestras[3][1], muestras[4][1]])
    montar({ ruta: '/mi-viaje' })
    expect(screen.getByRole('heading', { name: 'Mis itinerarios' })).toBeInTheDocument()
    for (const nombre of ['Izamal', 'Valladolid', 'Tekit', 'Homún', 'Ticul']) {
      expect(await screen.findByRole('link', { name: `Abrir itinerario de ${nombre}` })).toBeInTheDocument()
    }
    expect(within(screen.getByRole('navigation', { name: 'Navegación principal' })).getByRole('link', { name: 'Mi viaje' })).toHaveAttribute('aria-current', 'page')
  })

  it('mantiene Mi viaje protegido y guarda el destino de regreso para la sesión', async () => {
    const { router } = montar({ sesion: false, ruta: '/mi-viaje' })
    expect(await screen.findByRole('heading', { name: 'Acceso de prueba' })).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ desde: '/mi-viaje' })
  })

  it('marca Rutas como sección activa al elegir planificador desde recorridos', () => {
    montar({ ruta: '/recorridos' })
    expect(screen.getByRole('heading', { name: 'Elige tu destino' })).toBeInTheDocument()
    expect(within(screen.getByRole('navigation', { name: 'Navegación principal' })).getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page')
  })

  it('lee solo los guardados de la cuenta actual y no reescribe ninguna cuenta', async () => {
    sembrar(7, [izamal])
    sembrar(8, [muestras[1][1]])
    const anterior = localStorage.getItem('biin:itinerarios:v1:7')
    montar()
    expect(await screen.findByRole('link', { name: 'Ver ruta de Izamal' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver ruta de Valladolid' })).not.toBeInTheDocument()
    expect(localStorage.getItem('biin:itinerarios:v1:7')).toBe(anterior)
    expect(screen.getAllByLabelText('Sin datos disponibles')).toHaveLength(3)
  })

  it('muestra los dos guardados más recientes y permite gestionar el resto', async () => {
    sembrar(7, [
      { ...izamal, id: 'antiguo', guardadoEn: '2026-11-20T10:00:00Z', borrador: { ...borrador, configuracion: { ...borrador.configuracion, fecha: '2026-12-01' } } },
      { ...izamal, id: 'nuevo', guardadoEn: '2026-11-25T10:00:00Z', borrador: { ...borrador, configuracion: { ...borrador.configuracion, fecha: '2026-12-03' } } },
      { ...izamal, id: 'medio', guardadoEn: '2026-11-23T10:00:00Z', borrador: { ...borrador, configuracion: { ...borrador.configuracion, fecha: '2026-12-02' } } },
    ])
    montar()
    const enlaces = await screen.findAllByRole('link', { name: 'Ver ruta de Izamal' })
    expect(enlaces).toHaveLength(2)
    expect(enlaces[0].getAttribute('href')).toContain('fecha=2026-12-03')
    expect(enlaces[1].getAttribute('href')).toContain('fecha=2026-12-02')
    await userEvent.click(screen.getByRole('link', { name: 'Gestionar' }))
    expect(screen.getByRole('heading', { name: 'Mis itinerarios' })).toBeInTheDocument()
  })

  it('conserva intactos los datos locales dañados para permitir su importación posterior', async () => {
    localStorage.setItem('biin:itinerarios:v1:7', '{roto')
    montar()
    expect(await screen.findByText(/No hay itinerarios guardados para esta cuenta/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(localStorage.getItem('biin:itinerarios:v1:7')).toBe('{roto')
  })

  it('mantiene accesible el perfil si el almacenamiento local está bloqueado', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloqueado', 'SecurityError') })
    montar()
    expect(screen.getByRole('heading', { name: 'Ana López' })).toBeInTheDocument()
    expect(await screen.findByText(/No hay itinerarios guardados para esta cuenta/)).toBeInTheDocument()
  })

  it('permite usar Editar perfil con teclado y explica su integración pendiente', async () => {
    montar()
    screen.getByRole('button', { name: 'Editar perfil' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('No se ha modificado ningún dato')
  })

  it('da respuesta accesible a las acciones pendientes sin afirmar cambios', async () => {
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Preferencias de viaje y accesibilidad' }))
    expect(screen.getByRole('status')).toHaveTextContent('No se han cambiado tus ajustes')
    await userEvent.click(screen.getByRole('button', { name: 'Centro de Asistencia Ciudadana' }))
    expect(screen.getByRole('status')).toHaveTextContent('No se ha enviado ninguna solicitud')
    await userEvent.click(screen.getByRole('button', { name: 'Ver historial' }))
    expect(screen.getByRole('status')).toHaveTextContent('no acreditan viajes realizados')
  })

  it('cierra la sesión con la acción existente y abre el acceso', async () => {
    const { contexto } = montar()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión / Cambiar cuenta' }))
    expect(contexto.cerrarSesion).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('heading', { name: 'Acceso de prueba' })).toBeInTheDocument()
  })

  it('ofrece una vista previa sin crear sesión ni escribir itinerarios', async () => {
    const { contexto } = montar({ previa: true, sesion: false })
    expect(screen.getByText(/No representa una sesión ni actividad real/)).toBeInTheDocument()
    expect(screen.getByText('Izamal Express')).toBeInTheDocument()
    expect(screen.getByText('Homún Cenotes')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(nav).getByRole('link', { name: 'Perfil' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión / Cambiar cuenta' }))
    expect(screen.getByRole('status')).toHaveTextContent('no tiene una sesión real')
    expect(contexto.cerrarSesion).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })

  it('conserva una alternativa al avatar si la imagen del prototipo falla', () => {
    montar({ previa: true, sesion: false })
    fireEvent.error(screen.getByAltText(''))
    expect(screen.getByText('MG')).toBeInTheDocument()
  })

  it('conserva nombres y correos largos completos en el contenido accesible', () => {
    const nombre = 'Nombre de ejemplo muy largo con varios apellidos'
    const correo = 'cuenta.de.ejemplo.muy.larga@dominio-de-prueba.example'
    montar({ nombre, correo })
    expect(screen.getByRole('heading', { name: nombre })).toBeInTheDocument()
    expect(screen.getByText(correo)).toBeInTheDocument()
  })
})
