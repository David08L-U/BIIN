import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, tokenAlmacenado } from '../../src/services/api'
import { idPositivo, todasLasPaginas } from '../../src/utils/consultaApi'
import { rutasApi } from '../../src/features/transporte/api'
import { recorridosApi } from '../../src/features/recorridos/api'
import { contenidosApi } from '../../src/features/explorar/api'
import { itinerariosApi } from '../../src/features/mi-viaje/api'
import { pagina, resumenRuta, simularApi } from './fixtures'

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })
describe('contratos HTTP reales del frontend', () => {
  it('envía token, parámetros codificados y todas las páginas de rutas', async () => {
    tokenAlmacenado.guardar('token-ficticio')
    const fetch = simularApi((url, init) => {
      expect(init.headers).toMatchObject({ Authorization: 'Bearer token-ficticio' })
      expect(url.searchParams.get('destino')).toBe('Homún & alrededores')
      const n = Number(url.searchParams.get('pagina'))
      return { items: [resumenRuta(n)], total: 2, pagina: n, tamano: 1 }
    })
    expect((await rutasApi.listar({ destino: 'Homún & alrededores' })).map(r => r.idRuta)).toEqual([1, 2])
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('consulta recorridos por localidad y contenido por su tipo', async () => {
    const fetch = simularApi(() => pagina([]))
    await recorridosApi.listar({ idLocalidadBase: 802 })
    expect(fetch.mock.calls[0][0]).toContain('idLocalidadBase=802')
    await contenidosApi.obtener('negocio', 99)
    expect(fetch.mock.calls[1][0]).toBe('/api/negocios/99')
  })
  it('manda actividades y orden al contrato normalizado de itinerarios', async () => {
    const fetch = simularApi(() => ({}))
    await itinerariosApi.agregarActividad(345, { idRecurso: 721 })
    await itinerariosApi.reordenarActividades(345, { idActividades: [1002, 1001] })
    expect(fetch.mock.calls[0][0]).toBe('/api/itinerarios/345/actividades')
    expect(JSON.parse(fetch.mock.calls[0][1]!.body as string)).toEqual({ idRecurso: 721 })
    expect(fetch.mock.calls[1][1]!.method).toBe('PUT')
    expect(JSON.parse(fetch.mock.calls[1][1]!.body as string)).toEqual({ idActividades: [1002, 1001] })
  })
  it.each([400, 401, 403, 404, 409, 500])('conserva ProblemDetails y código %i', async estado => {
    simularApi(() => new Response(JSON.stringify({ detail: 'Mensaje del servidor' }), { status: estado }))
    await expect(api.get('/prueba')).rejects.toMatchObject({ estado, message: 'Mensaje del servidor' })
  })
  it('distingue una respuesta vacía válida de JSON inválido', async () => {
    simularApi(() => new Response(null, { status: 204 }))
    await expect(api.delete('/prueba')).resolves.toBeUndefined()
    simularApi(() => new Response('<html>Error</html>'))
    await expect(api.get('/prueba')).rejects.toBeInstanceOf(ApiError)
  })
  it('no silencia fallos ni trunca listados inconsistentes', async () => {
    await expect(todasLasPaginas(async () => ({ ...pagina([]), total: 10 }))).rejects.toThrow(/catálogo cambió/)
  })
  it.each(['0', '-1', '1.2', '1e3', '2147483648', '01', ''])('rechaza el id %s', id => expect(idPositivo(id)).toBeNull())
  it('acepta ids reales distintos de cualquier catálogo fijo', () => expect(idPositivo('901')).toBe(901))
})
