import { afterEach, describe, expect, it, vi } from 'vitest'
import { compartirTekit, descargarTekit, textoPlanTekit } from '../../src/features/mi-viaje/plan/accionesTekit'
import { crearBorradorTekit, leerBorradorTekit, urlBorradorTekit } from '../../src/features/mi-viaje/plan/borradorTekit'
import { calcularPlanTekit } from '../../src/features/mi-viaje/plan/itinerarioTekit'

const base = () => {
  const b = crearBorradorTekit('ruta-textil', 'personalizado')
  return { ...b, configuracion: { ...b.configuracion, fecha: '2026-11-30', minutosDisponibles: '180' }, seleccion: ['taller-bordado', 'corredor-textil'], generado: true }
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('Compartir y descargar Tekit', () => {
  it('comparte una vista previa reproducible con configuración y orden, sin cuenta', async () => {
    const b = base()
    const url = new URL(urlBorradorTekit('itinerario', b), 'https://biin.test').href
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    expect((await compartirTekit(url)).estado).toBe('compartido')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tu Itinerario BIIN en Tekit', url }))
    expect(calcularPlanTekit(leerBorradorTekit(new URL(url).searchParams))).toEqual(calcularPlanTekit(b))
    expect(url).not.toMatch(/idUsuario|correo|token/)
  })
  it.each([new DOMException('Cancelado', 'AbortError'), { name: 'AbortError' }])('cancelar no copia ni anuncia éxito (%j)', async error => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(error), clipboard: { writeText } })
    const r = await compartirTekit('https://biin.test/plan')
    expect(r.estado).toBe('cancelado')
    expect(r.mensaje).toContain('Se canceló compartir')
    expect(writeText).not.toHaveBeenCalled()
  })
  it('copia de verdad cuando Web Share no está disponible', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect((await compartirTekit('https://biin.test/plan')).estado).toBe('copiado')
    expect(writeText).toHaveBeenCalledWith('https://biin.test/plan')
  })
  it('ofrece una alternativa manual cuando faltan ambas API o fallan', async () => {
    for (const n of [{}, { share: vi.fn().mockRejectedValue(new Error('Bloqueado')), clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Bloqueado')) } }]) {
      vi.stubGlobal('navigator', n)
      expect((await compartirTekit('https://biin.test/plan')).estado).toBe('manual')
    }
  })
  it('descarga texto UTF-8 legible, con todos los bloques y límites reales; libera la URL', () => {
    const b = base()
    const plan = calcularPlanTekit(b).plan!
    const texto = textoPlanTekit(b, plan)
    expect(texto).toContain('Fecha de visita: 2026-11-30')
    expect(texto).toContain('Ruta Textil · Compras')
    expect(texto).toContain('1 h 50 min de visitas + 8 min de traslados (incluye regreso final) + 15 min de margen = 2 h 13 min')
    expect(texto).toContain('Tiempo libre: 47 min')
    expect(texto).toContain('estimaciones por confirmar')
    expect(texto).toContain('No incluye mapas offline ni reservas')
    for (const b of plan.bloques) expect(texto).toContain(b.titulo)
    const createObjectURL = vi.fn().mockReturnValue('blob:tekit')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.useFakeTimers()
    descargarTekit(b, plan)
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/plain;charset=utf-8')
    expect(blob.size).toBeGreaterThan(texto.length)
    expect(click).toHaveBeenCalledOnce()
    const enlace = click.mock.contexts[0] as HTMLAnchorElement
    expect(enlace.download).toBe('biin-tekit-2026-11-30.txt')
    expect(enlace.href).toBe('blob:tekit')
    expect(document.body.contains(enlace)).toBe(false)
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:tekit')
  })
  it('propaga el fallo de descarga para comunicarlo sin simular éxito', () => {
    vi.stubGlobal('URL', { createObjectURL: () => { throw new Error('Bloqueado') } })
    expect(() => descargarTekit(base(), calcularPlanTekit(base()).plan!)).toThrow('Bloqueado')
  })
})
