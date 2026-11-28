import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useConsultaApi } from '../../src/hooks/useConsultaApi'

describe('lecturas por clave de destino o cuenta', () => {
  it('descarta una respuesta lenta del destino anterior', async () => {
    let resolverA!: (valor: string) => void
    const a = new Promise<string>(resolve => { resolverA = resolve })
    const { result, rerender } = renderHook(({ id }) => useConsultaApi(id, async () => id === 'A' ? a : 'Destino B'), { initialProps: { id: 'A' } })
    await act(async () => {})
    rerender({ id: 'B' })
    expect(result.current.datos).toBeNull()
    await waitFor(() => expect(result.current.datos).toBe('Destino B'))
    await act(async () => resolverA('Destino A'))
    expect(result.current.datos).toBe('Destino B')
  })
  it('captura validaciones síncronas y permite reintentar', async () => {
    let falla = true
    const { result } = renderHook(() => useConsultaApi('id-invalido', () => { if (falla) throw new Error('No válido'); return Promise.resolve('Corregido') }))
    await waitFor(() => expect(result.current.error).toBe('No válido'))
    falla = false
    act(() => result.current.reintentar())
    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.datos).toBe('Corregido'))
  })
  it('cancela el signal al desmontar o cambiar de cuenta', async () => {
    const signals: AbortSignal[] = []
    const { rerender, unmount } = renderHook(({ usuario }) => useConsultaApi(`cuenta:${usuario}`, async signal => { signals.push(signal); return [] }), { initialProps: { usuario: 1 } })
    await act(async () => {})
    rerender({ usuario: 2 })
    await act(async () => {})
    expect(signals[0].aborted).toBe(true)
    expect(signals[1].aborted).toBe(false)
    unmount()
    expect(signals[1].aborted).toBe(true)
  })
})
