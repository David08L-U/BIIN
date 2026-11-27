import { afterEach, describe, expect, it, vi } from 'vitest'
import { compartirHomun, descargarHomun, textoPlanHomun } from '../../src/features/mi-viaje/plan/accionesHomun'
import { crearBorradorHomun, leerBorradorHomun, urlBorradorHomun } from '../../src/features/mi-viaje/plan/borradorHomun'
import { calcularPlanHomun } from '../../src/features/mi-viaje/plan/itinerarioHomun'

function visita() {
  const b = crearBorradorHomun('fin-de-semana')
  b.configuracion.fecha = '2026-12-31'; b.generado = true
  b.seleccion = calcularPlanHomun(b).plan!.seleccion
  return b
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('Acciones reales de Homún', () => {
  it('comparte una URL reproducible con dos jornadas sin datos de cuenta', async () => {
    const b = visita()
    const url = new URL(urlBorradorHomun('itinerario', b), 'https://biin.test').href
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    expect((await compartirHomun(url)).estado).toBe('compartido')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tu Itinerario BIIN en Homún', url }))
    expect(calcularPlanHomun(leerBorradorHomun(new URL(url).searchParams))).toEqual(calcularPlanHomun(b))
    expect(url).not.toMatch(/idUsuario|token|correo/)
  })
  it.each([new DOMException('Cancelado', 'AbortError'), { name: 'AbortError' }])('cancelar no copia ni anuncia éxito (%j)', async error => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(error), clipboard: { writeText } })
    expect((await compartirHomun('https://biin.test/plan')).estado).toBe('cancelado')
    expect(writeText).not.toHaveBeenCalled()
  })
  it('copia de verdad si Web Share no está disponible', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect((await compartirHomun('https://biin.test/plan')).estado).toBe('copiado')
    expect(writeText).toHaveBeenCalledWith('https://biin.test/plan')
  })
  it('ofrece copia manual cuando faltan las API o fallan', async () => {
    for (const n of [{}, { share: vi.fn().mockRejectedValue(new Error('Bloqueado')), clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Bloqueado')) } }]) {
      vi.stubGlobal('navigator', n)
      expect((await compartirHomun('https://biin.test/plan')).estado).toBe('manual')
    }
  })
  it('descarga un archivo legible con las dos fechas, tipos de traslado y supuestos', () => {
    const b = visita(), plan = calcularPlanHomun(b).plan!
    const texto = textoPlanHomun(b, plan)
    for (const s of ['Llegada al destino el Día 1', 'único regreso al final del último día', 'Día 1 · 2026-12-31', 'Día 2 · 2027-01-01', 'Mototaxi estimado', 'Traslado entre senderos estimado', 'A pie estimado', '15 min de margen', 'supuesto de 5 min', 'Libres:', 'no es una salida confirmada', 'No incluye mapas offline ni reservas']) expect(texto).toContain(s)
    for (const d of plan.jornadas) for (const bloque of d.bloques) expect(texto).toContain(bloque.titulo)
    const createObjectURL = vi.fn().mockReturnValue('blob:homun'), revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.useFakeTimers()
    descargarHomun(b, plan)
    const archivo = createObjectURL.mock.calls[0][0] as Blob
    expect(archivo.type).toBe('text/plain;charset=utf-8')
    expect(archivo.size).toBeGreaterThan(texto.length)
    expect(click).toHaveBeenCalledOnce()
    const enlace = click.mock.contexts[0] as HTMLAnchorElement
    expect(enlace.download).toBe('biin-homun-2026-12-31.txt')
    expect(enlace.href).toBe('blob:homun')
    expect(document.body.contains(enlace)).toBe(false)
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:homun')
  })
  it('propaga el fallo real de descarga para comunicarlo sin éxito ficticio', () => {
    const b = visita(), plan = calcularPlanHomun(b).plan!
    vi.stubGlobal('URL', { createObjectURL: () => { throw new Error('Bloqueado') } })
    expect(() => descargarHomun(b, plan)).toThrow('Bloqueado')
  })
})
