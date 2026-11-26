import { afterEach, describe, expect, it, vi } from 'vitest'
import { compartirValladolid, descargarValladolid, textoPlanValladolid } from '../../src/features/mi-viaje/plan/accionesValladolid'
import { crearBorradorValladolid, urlBorradorValladolid, leerBorradorValladolid } from '../../src/features/mi-viaje/plan/borradorValladolid'
import { calcularPlanValladolid } from '../../src/features/mi-viaje/plan/itinerarioValladolid'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('Acciones reales del itinerario de Valladolid', () => {
  it('comparte una URL que reproduce configuración y jornadas sin datos de cuenta', async () => {
    const b = crearBorradorValladolid('fin-de-semana')
    b.configuracion.fecha = '2026-11-30'
    b.generado = true
    const plan = calcularPlanValladolid(b).plan!
    b.seleccion = plan.seleccion
    const url = new URL(urlBorradorValladolid('itinerario', b), 'https://biin.test').href
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    expect((await compartirValladolid(url)).estado).toBe('compartido')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url }))
    expect(calcularPlanValladolid(leerBorradorValladolid(new URL(url).searchParams)).plan).toEqual(plan)
    expect(url).not.toMatch(/idUsuario|token|correo/)
  })

  it('copia realmente el enlace cuando compartir no está disponible', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect((await compartirValladolid('https://biin.test/plan')).estado).toBe('copiado')
    expect(writeText).toHaveBeenCalledWith('https://biin.test/plan')
  })

  it('tolera cancelaciones sin afirmar que compartió ni copiar silenciosamente', async () => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('Cancelado', 'AbortError')), clipboard: { writeText } })
    expect((await compartirValladolid('https://biin.test/plan')).estado).toBe('cancelado')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('ofrece copia manual si fallan compartir y portapapeles', async () => {
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new Error('Bloqueado')), clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Bloqueado')) } })
    const respuesta = await compartirValladolid('https://biin.test/plan')
    expect(respuesta.estado).toBe('manual')
    expect(respuesta.mensaje).toContain('No se pudo compartir ni copiar automáticamente')
  })

  it('descarga un archivo legible de ambas jornadas y libera la URL temporal', () => {
    const b = crearBorradorValladolid('fin-de-semana')
    b.configuracion.fecha = '2026-12-31'
    const plan = calcularPlanValladolid(b).plan!
    const texto = textoPlanValladolid(b, plan)
    expect(texto).toContain('Día 1 · 2026-12-31')
    expect(texto).toContain('Día 2 · 2027-01-01')
    expect(texto).toContain('15 min de margen')
    expect(texto).toContain('No incluye mapas offline ni reservas')
    for (const dia of plan.jornadas) for (const bloque of dia.bloques) expect(texto).toContain(bloque.titulo)
    const createObjectURL = vi.fn().mockReturnValue('blob:plan')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.useFakeTimers()
    descargarValladolid(b, plan)
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(click).toHaveBeenCalledOnce()
    const enlace = click.mock.contexts[0] as HTMLAnchorElement
    expect(enlace.download).toBe('biin-valladolid-2026-12-31.txt')
    expect(enlace.href).toBe('blob:plan')
    expect(document.body.contains(enlace)).toBe(false)
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:plan')
  })

  it('propaga un fallo real de descarga para que la interfaz no anuncie éxito', () => {
    const b = crearBorradorValladolid()
    b.configuracion.fecha = '2026-11-30'
    vi.stubGlobal('URL', { createObjectURL: () => { throw new Error('Descarga bloqueada') } })
    expect(() => descargarValladolid(b, calcularPlanValladolid(b).plan!)).toThrow('Descarga bloqueada')
  })
})
