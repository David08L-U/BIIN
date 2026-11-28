import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGuardarPlanApi } from '../../src/features/mi-viaje/hooks/useGuardarPlanApi'
import { itinerariosApi } from '../../src/features/mi-viaje/api'
import { ApiError } from '../../src/services/api'
import { itinerario, recorrido } from './fixtures'

const config = { nombre: 'Visita de prueba', inicio: '2026-12-01', fin: '2026-12-02', presupuesto: '0', horaInicio: '09:30' }
afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

describe('guardado con la API existente', () => {
  it('clona el recorrido recomendado usando su id y la hora local', async () => {
    const crear = vi.spyOn(itinerariosApi, 'crearDesdeRecorrido').mockResolvedValue(itinerario())
    const { result } = renderHook(() => useGuardarPlanApi())
    await act(async () => { await result.current.guardar(recorrido(777), config, [1, 2], false) })
    expect(crear).toHaveBeenCalledWith(777, { nombre: 'Visita de prueba', inicio: '2026-12-01', fin: '2026-12-02', presupuestoEstimado: 0, horaInicioLocal: '09:30:00' })
  })
  it('persiste la selección personalizada en su orden con ids de recursos', async () => {
    const crear = vi.spyOn(itinerariosApi, 'crear').mockResolvedValue(itinerario())
    const agregar = vi.spyOn(itinerariosApi, 'agregarActividad').mockResolvedValue(itinerario())
    const { result } = renderHook(() => useGuardarPlanApi())
    await act(async () => { await result.current.guardar(recorrido(), config, [2, 1], true) })
    expect(crear).toHaveBeenCalledTimes(1)
    expect(agregar.mock.calls).toEqual([[345, { idRecurso: 722 }], [345, { idRecurso: 721 }]])
  })
  it('bloquea el doble envío mientras la escritura está en curso', async () => {
    let resolver!: (valor: ReturnType<typeof itinerario>) => void
    const crear = vi.spyOn(itinerariosApi, 'crearDesdeRecorrido').mockReturnValue(new Promise(resolve => { resolver = resolve }))
    const { result } = renderHook(() => useGuardarPlanApi())
    let primero!: Promise<unknown>
    await act(async () => { primero = result.current.guardar(recorrido(), config, [1], false); await result.current.guardar(recorrido(), config, [1], false) })
    expect(crear).toHaveBeenCalledTimes(1)
    await act(async () => { resolver(itinerario()); await primero })
  })
  it('conserva el id de una creación parcial y evita duplicarla al reintentar', async () => {
    const crear = vi.spyOn(itinerariosApi, 'crear').mockResolvedValue(itinerario())
    vi.spyOn(itinerariosApi, 'agregarActividad').mockRejectedValue(new ApiError(409, 'Contenido retirado'))
    const { result } = renderHook(() => useGuardarPlanApi())
    await act(async () => { await result.current.guardar(recorrido(), config, [1], true) })
    expect(result.current.parcial).toBe(345)
    expect(result.current.error).toContain('parcialmente')
    await act(async () => { await result.current.guardar(recorrido(), config, [1], true) })
    expect(crear).toHaveBeenCalledTimes(1)
  })
  it('no interpreta un error de red tras POST como un guardado fallido seguro', async () => {
    const crear = vi.spyOn(itinerariosApi, 'crearDesdeRecorrido').mockRejectedValue(new ApiError(0, 'Desconexión'))
    const { result } = renderHook(() => useGuardarPlanApi())
    await act(async () => { await result.current.guardar(recorrido(), config, [1], false) })
    expect(result.current.incierto).toBe(true)
    await act(async () => { await result.current.guardar(recorrido(), config, [1], false) })
    expect(crear).toHaveBeenCalledTimes(1)
  })
  it('detiene la cadena de actividades al abandonar la pantalla o cerrar sesión', async () => {
    let resolver!: (valor: ReturnType<typeof itinerario>) => void
    vi.spyOn(itinerariosApi, 'crear').mockReturnValue(new Promise(resolve => { resolver = resolve }))
    const agregar = vi.spyOn(itinerariosApi, 'agregarActividad').mockResolvedValue(itinerario())
    const { result, unmount } = renderHook(() => useGuardarPlanApi())
    let guardado!: Promise<unknown>
    await act(async () => { guardado = result.current.guardar(recorrido(), config, [1], true) })
    unmount()
    await act(async () => { resolver(itinerario()); expect(await guardado).toBeNull() })
    expect(agregar).not.toHaveBeenCalled()
  })
})
