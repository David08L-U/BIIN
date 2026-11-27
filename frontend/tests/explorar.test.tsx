import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ExplorarPage, { ExplorarDetallePage } from '../src/features/explorar/pages/ExplorarPage'
import ElegirItinerarioPage from '../src/features/explorar/pages/ElegirItinerarioPage'
import ElegirModoItinerarioPage from '../src/features/explorar/pages/ElegirModoItinerarioPage'
import EntradaItinerariosPage from '../src/features/mi-viaje/pages/EntradaItinerariosPage'
import { buscarLugares, lugaresExplorar } from '../src/features/explorar/data/lugaresExplorar'
import InicioPage from '../src/features/transporte/pages/InicioPage'

vi.mock('../src/features/auth/useAuth', () => ({ useAuth: () => ({ usuario: null, cargando: false, tieneRol: () => false, cerrarSesion: vi.fn() }) }))

describe('Explorar', () => {
  it('usa datos propios con identificadores compuestos para los cinco destinos', () => {
    expect(new Set(lugaresExplorar.map(l => l.destino))).toEqual(new Set(['izamal', 'valladolid', 'tekit', 'homun', 'ticul']))
    expect(lugaresExplorar.some(l => l.destino === 'izamal' && l.nombre === 'Convento San Antonio de Padua')).toBe(true)
    expect(lugaresExplorar.some(l => l.destino === 'homun' && l.imagen)).toBe(false)
  })

  it('empaqueta localmente solo las fotografías identificadas y atribuidas', () => {
    const fotografiados = lugaresExplorar.filter(lugar => lugar.imagen)
    expect(fotografiados).toHaveLength(9)
    expect(fotografiados.every(lugar => !lugar.imagen!.src.startsWith('http'))).toBe(true)
  })

  it('busca sin acentos/mayúsculas y combina destino y categoría', () => {
    expect(buscarLugares('cenote tza', 'homun', 'cenotes').map(l => l.id)).toEqual(['tza-ujun-kat'])
    expect(buscarLugares('ZACI', 'valladolid', 'cenotes')).toHaveLength(1)
    expect(buscarLugares('nada que exista')).toHaveLength(0)
  })

  it('filtra, limpia y comunica estado vacío', () => {
    const router = createMemoryRouter([{ path: '/explorar', element: <ExplorarPage /> }], { initialEntries: ['/explorar'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tekit' }))
    expect(screen.getByRole('button', { name: 'Tekit' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.change(screen.getByLabelText('Buscar lugares'), { target: { value: 'sin coincidencia' } })
    expect(screen.getByText(/No encontramos lugares/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByRole('heading', { name: 'Corredor Textil y Tiendas de Fabricantes' })).toBeInTheDocument()
  })

  it('combina los botones de destino con búsqueda y categoría', () => {
    const router = createMemoryRouter([{ path: '/explorar', element: <ExplorarPage /> }], { initialEntries: ['/explorar'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('button', { name: 'Valladolid' }))
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'cenotes' } })
    fireEvent.change(screen.getByLabelText('Buscar lugares'), { target: { value: 'ZACI' } })
    expect(screen.getByRole('heading', { name: 'Cenote Zací y Parque Principal' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 lugar')
  })

  it('atribución visible, carga diferida y alternativa si la foto no carga', () => {
    render(<RouterProvider router={createMemoryRouter([{ path: '/explorar', element: <ExplorarPage /> }], { initialEntries: ['/explorar?q=zaci'] })} />)
    const foto = screen.getByRole('img', { name: 'Cenote Zací en Valladolid' })
    expect(foto).toHaveAttribute('loading', 'lazy')
    expect(foto.getAttribute('src')).toContain('valladolid-zaci')
    expect(screen.getByRole('link', { name: /Haakon S. Krohn · CC BY 4.0/ })).toHaveAttribute('href', 'https://commons.wikimedia.org/wiki/File:Cenote_Zac%C3%AD_01.jpg')
    fireEvent.error(foto)
    expect(screen.getByRole('img', { name: 'Fotografía no disponible: Cenote Zací y Parque Principal' })).toBeInTheDocument()
  })

  it('combina destino, categoría y búsqueda', () => {
    const router = createMemoryRouter([{ path: '/explorar', element: <ExplorarPage /> }], { initialEntries: ['/explorar'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('button', { name: 'Homún' }))
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'cenotes' } })
    fireEvent.change(screen.getByLabelText('Buscar lugares'), { target: { value: 'SANTA ROSA' } })
    expect(screen.getByRole('heading', { name: 'Cenote Santa Rosa' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 lugar')
  })

  it('solo muestra foto verificada con atribución y ofrece alternativa accesible al fallar', () => {
    render(<RouterProvider router={createMemoryRouter([{ path: '/explorar', element: <ExplorarPage /> }], { initialEntries: ['/explorar?q=zaci'] })} />)
    const foto = screen.getByRole('img', { name: 'Cenote Zací en Valladolid' })
    expect(foto).toHaveAttribute('loading', 'lazy')
    expect(foto.getAttribute('src')).toContain('valladolid-zaci')
    expect(screen.getByRole('link', { name: /Haakon S. Krohn · CC BY 4.0/ })).toHaveAttribute('href', 'https://commons.wikimedia.org/wiki/File:Cenote_Zac%C3%AD_01.jpg')
    fireEvent.error(foto)
    expect(screen.getByRole('img', { name: 'Fotografía no disponible: Cenote Zací y Parque Principal' })).toBeInTheDocument()
  })

  it('abre un lugar y conserva filtros al volver; el planear enlaza al destino', () => {
    const router = createMemoryRouter([
      { path: '/explorar', element: <ExplorarPage /> },
      { path: '/explorar/lugares/:destino/:id', element: <ExplorarDetallePage /> },
      { path: '/rutas/:destino/itinerario', element: <p>Detalle de ruta</p> },
    ], { initialEntries: ['/explorar?destino=homun&categoria=cenotes'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('link', { name: /Ver detalle de Cenote Santa Rosa/ }))
    expect(screen.getByRole('heading', { name: 'Cenote Santa Rosa' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Planear visita en Homún' }))
    expect(router.state.location.pathname).toBe('/rutas/homun/itinerario')
  })

  it('vuelve del detalle a la búsqueda anterior', () => {
    const router = createMemoryRouter([
      { path: '/explorar', element: <ExplorarPage /> },
      { path: '/explorar/lugares/:destino/:id', element: <ExplorarDetallePage /> },
    ], { initialEntries: ['/explorar?q=mercado&destino=ticul'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('link', { name: /Ver detalle de Poc Chuc Ticule/ }))
    fireEvent.click(screen.getByRole('button', { name: '← Volver a resultados' }))
    expect(router.state.location.pathname + router.state.location.search).toBe('/explorar?q=mercado&destino=ticul')
  })

  it('conserva el lugar como intención de retorno cuando agregar requiere acceso', async () => {
    const router = createMemoryRouter([
      { path: '/explorar/lugares/:destino/:id', element: <ExplorarDetallePage /> },
      { path: '/login', element: <p>Acceso</p> },
    ], { initialEntries: ['/explorar/lugares/tekit/corredor-textil'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a itinerario' }))
    expect(router.state.location.pathname).toBe('/login')
    expect((router.state.location.state as { desde: string }).desde).toContain('agregarLugar=corredor-textil')
  })
})

describe('Acceso al planificador desde Inicio', () => {
  it('Inicio abre Mi viaje y permite crear para visitante sin mostrar guardados ajenos', () => {
    const router = createMemoryRouter([
      { element: <Outlet context={{ abrirMenu: () => {} }} />, children: [
        { path: '/', element: <InicioPage /> },
        { path: '/recorridos', element: <EntradaItinerariosPage /> },
        { path: '/recorridos/crear', element: <ElegirItinerarioPage /> },
        { path: '/recorridos/crear/:destino', element: <ElegirModoItinerarioPage /> },
        { path: '/login', element: <h1>Iniciar sesión</h1> },
        { path: '/rutas/:destino/:pantalla', element: <p>Planificador</p> },
      ] },
    ], { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('link', { name: /Itinerario/ }))
    expect(router.state.location.pathname).toBe('/recorridos')
    expect(screen.getByRole('heading', { name: 'Mis itinerarios guardados' })).toBeInTheDocument()
    expect(screen.getByText(/Inicia sesión para consultar los itinerarios de tu cuenta/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Crear itinerario' }))
    expect(screen.getByRole('heading', { name: 'Elige tu destino' })).toBeInTheDocument()
    expect(screen.getAllByRole('link').filter(link => /recorridos\/crear\//.test(link.getAttribute('href') ?? ''))).toHaveLength(5)
    expect(screen.getByText('temple_buddhist')).toBeInTheDocument()
    expect(screen.getByText('water_drop')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('selecciona destino, modalidad y regresa al paso anterior conservando el planificador', () => {
    const router = createMemoryRouter([
      { path: '/recorridos', element: <EntradaItinerariosPage /> },
      { path: '/recorridos/crear', element: <ElegirItinerarioPage /> },
      { path: '/recorridos/crear/:destino', element: <ElegirModoItinerarioPage /> },
      { path: '/rutas/:destino/:pantalla', element: <p>Planificador</p> },
    ], { initialEntries: ['/recorridos/crear'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('link', { name: /Izamal/ }))
    expect(screen.getByRole('heading', { name: '¿Cómo quieres planear tu visita?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Usar recomendado' })).toHaveAttribute('href', expect.stringContaining('/rutas/izamal/itinerario'))
    fireEvent.click(screen.getByRole('link', { name: 'Personalizar itinerario' }))
    expect(router.state.location.pathname).toBe('/rutas/izamal/personalizar')
    expect(router.state.location.state).toEqual({ volverPlan: '/recorridos/crear/izamal' })
  })

  it('conserva Mi viaje como destino de retorno al solicitar acceso a los guardados', () => {
    const router = createMemoryRouter([
      { path: '/recorridos', element: <EntradaItinerariosPage /> },
      { path: '/login', element: <h1>Iniciar sesión</h1> },
    ], { initialEntries: ['/recorridos'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('link', { name: 'Iniciar sesión' }))
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state).toEqual({ desde: '/recorridos' })
  })
})
