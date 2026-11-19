import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFavoritos } from '../src/features/mi-viaje/useFavoritos'
import { usePlanes } from '../src/features/mi-viaje/usePlanes'
import type { Plan } from '../src/types/catalogo'
const plan: Plan = {
  id: 'borrador-1',
  destinoId: 'izamal',
  fecha: '2026-12-01',
  inicio: '11:28',
  limite: 270,
  actividades: ['izamal-convento'],
  actualizadoEn: '2026-11-18T12:00:00Z',
}

describe('CU-09/10 Persistencia local', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })
  it('agrega y quita un favorito después de recargar el hook', () => {
    const primero = renderHook(() => useFavoritos())
    act(() => primero.result.current.alternar('izamal'))
    primero.unmount()
    const segundo = renderHook(() => useFavoritos())
    expect(segundo.result.current.favoritos).toEqual(['izamal'])
    act(() => segundo.result.current.alternar('izamal'))
    expect(segundo.result.current.favoritos).toEqual([])
  })
  it('recupera un estado seguro si el JSON está dañado', () => {
    localStorage.setItem('biin.planes.v1', '{roto')
    expect(renderHook(() => usePlanes()).result.current.planes).toEqual([])
  })
  it('ignora entradas almacenadas con una forma incorrecta', () => {
    localStorage.setItem('biin.favoritos.v1', JSON.stringify([{}, 3]))
    expect(renderHook(() => useFavoritos()).result.current.favoritos).toEqual(
      [],
    )
  })
  it('edita un borrador sin duplicarlo y permite borrarlo', () => {
    const { result } = renderHook(() => usePlanes())
    act(() => result.current.guardar(plan))
    act(() => result.current.guardar({ ...plan, fecha: '2026-12-02' }))
    expect(result.current.planes).toHaveLength(1)
    expect(result.current.planes[0].fecha).toBe('2026-12-02')
    act(() => result.current.borrar(plan.id))
    expect(result.current.planes).toEqual([])
  })
  it('no informa éxito ni modifica la lista cuando el navegador impide guardar', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Sin espacio', 'QuotaExceededError')
    })
    const { result } = renderHook(() => usePlanes())
    let ok: boolean | undefined
    act(() => {
      ok = result.current.guardar(plan)
    })
    expect(ok).toBe(false)
    expect(result.current.planes).toEqual([])
    expect(result.current.error).toContain('No se pudo guardar')
  })
})
