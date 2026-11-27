import { afterEach, describe, expect, it, vi } from 'vitest'
import { compartirTicul, descargarTicul, textoPlanTicul } from '../../src/features/mi-viaje/plan/accionesTicul'
import { crearBorradorTicul, leerBorradorTicul, urlBorradorTicul } from '../../src/features/mi-viaje/plan/borradorTicul'
import { calcularPlanTicul } from '../../src/features/mi-viaje/plan/itinerarioTicul'

function visita() {
  const b = crearBorradorTicul('dia-completo')
  b.configuracion.fecha = '2026-12-31'; b.configuracion.minutosDisponibles = '300'; b.generado = true
  b.seleccion = calcularPlanTicul(b).plan!.seleccion
  return b
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('Acciones reales de Ticul', () => {
  it('comparte una URL reproducible con modalidad y selección sin datos de cuenta', async () => {
    const b = visita()
    const url = new URL(urlBorradorTicul('itinerario', b), 'https://biin.test').href
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    expect((await compartirTicul(url)).estado).toBe('compartido')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tu Itinerario BIIN en Ticul', url }))
    expect(calcularPlanTicul(leerBorradorTicul(new URL(url).searchParams))).toEqual(calcularPlanTicul(b))
    expect(url).not.toMatch(/idUsuario|token|correo/)
  })
  it.each([new DOMException('Cancelado', 'AbortError'), { name: 'AbortError' }])('cancelar no copia ni anuncia éxito (%j)', async error => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(error), clipboard: { writeText } })
    expect((await compartirTicul('https://biin.test/plan')).estado).toBe('cancelado')
    expect(writeText).not.toHaveBeenCalled()
  })
  it('copia de verdad si Web Share no está disponible', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect((await compartirTicul('https://biin.test/plan')).estado).toBe('copiado')
    expect(writeText).toHaveBeenCalledWith('https://biin.test/plan')
  })
  it('ofrece copia manual cuando faltan las API o fallan', async () => {
    for (const n of [{}, { share: vi.fn().mockRejectedValue(new Error('Bloqueado')), clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Bloqueado')) } }]) {
      vi.stubGlobal('navigator', n)
      expect((await compartirTicul('https://biin.test/plan')).estado).toBe('manual')
    }
  })
  it('descarga un archivo legible con horarios, tipos de traslado y supuesto de comida', () => {
    const b = visita(), plan = calcularPlanTicul(b).plan!
    const texto = textoPlanTicul(b, plan)
    for (const s of ['Fecha de visita: 2026-12-31', 'Día completo', 'Mototaxi estimado', 'A pie estimado', '15 min de margen', '4 min a pie como supuesto demostrativo', 'Total: 3 h 30 min de visitas + 17 min de traslados', '= 4 h 2 min.', 'Tiempo libre: 58 min', 'no es una salida confirmada', 'No incluye mapas offline ni reservas']) expect(texto).toContain(s)
    for (const bloque of plan.bloques) expect(texto).toContain(bloque.titulo)
    const createObjectURL = vi.fn().mockReturnValue('blob:ticul'), revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.useFakeTimers()
    descargarTicul(b, plan)
    const archivo = createObjectURL.mock.calls[0][0] as Blob
    expect(archivo.type).toBe('text/plain;charset=utf-8')
    expect(archivo.size).toBeGreaterThan(texto.length)
    expect(click).toHaveBeenCalledOnce()
    const enlace = click.mock.contexts[0] as HTMLAnchorElement
    expect(enlace.download).toBe('biin-ticul-2026-12-31.txt')
    expect(enlace.href).toBe('blob:ticul')
    expect(document.body.contains(enlace)).toBe(false)
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:ticul')
  })
  it('propaga el fallo real de descarga para comunicarlo sin éxito ficticio', () => {
    const b = visita(), plan = calcularPlanTicul(b).plan!
    vi.stubGlobal('URL', { createObjectURL: () => { throw new Error('Bloqueado') } })
    expect(() => descargarTicul(b, plan)).toThrow('Bloqueado')
  })
})
