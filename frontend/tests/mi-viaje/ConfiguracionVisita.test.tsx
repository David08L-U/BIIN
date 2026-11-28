import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PlanificadorPage from '../../src/features/mi-viaje/pages/PlanificadorPage'
import { montar, pagina, recorrido, resumenRecorrido, ruta, simularApi } from '../api/fixtures'

vi.mock('../../src/maps/MapaRecorrido', () => ({ default: () => <div>Mapa de prueba</div> }))
afterEach(() => vi.unstubAllGlobals())
for (const modo of ['recomendado', 'personalizado'] as const) describe(`configuración compartida en ${modo}`, () => {
  it.each(['Izamal', 'Valladolid', 'Tekit', 'Homún', 'Ticul', 'Destino adicional'])('carga %s desde API y conserva fechas y presupuesto', async nombre => {
    simularApi(url => url.pathname === '/api/rutas/901' ? ruta(901, nombre) : url.pathname === '/api/recorridos/551' ? recorrido(551, nombre) : pagina([resumenRecorrido()]))
    const { router } = montar(<PlanificadorPage modo={modo} />, '/rutas/:id/plan', '/rutas/901/plan?recorrido=551&inicio=2026-12-01&fin=2026-12-03&presupuesto=250')
    expect(await screen.findByRole('group', { name: 'Configura tu visita' })).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de inicio')).toHaveValue('2026-12-01')
    expect(screen.getByLabelText('Fecha final')).toHaveValue('2026-12-03')
    expect(screen.getByLabelText(/Presupuesto estimado/)).toHaveValue(250)
    expect(screen.getByRole('heading', { name: `[PRUEBA] Visita ${nombre}` })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nombre del itinerario'), { target: { value: 'Visita editada' } })
    expect(new URLSearchParams(router.state.location.search).get('nombre')).toBe('Visita editada')
  })
})
