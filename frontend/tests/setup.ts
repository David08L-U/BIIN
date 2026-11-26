import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

type RegistroItinerario = { idItinerario: number; nombre: string; inicio: string; fin: string; guardadoEn: string; destino: string; borrador: Record<string, unknown> }
let registros: RegistroItinerario[] = []
let siguienteId = 1
let fetchOriginal: typeof fetch | undefined

export function sembrarItinerariosServidorPrueba(items: Array<{ destino?: string; borrador: Record<string, unknown>; guardadoEn?: string }>) {
  registros = items.map(item => {
    const config = item.borrador.configuracion as { fecha?: string } | undefined
    return { idItinerario: siguienteId++, nombre: 'Itinerario', inicio: config?.fecha ?? '2026-01-01', fin: config?.fecha ?? '2026-01-01', guardadoEn: item.guardadoEn ?? new Date().toISOString(), destino: item.destino ?? 'izamal', borrador: item.borrador }
  })
}

beforeEach(() => {
  registros = []
  siguienteId = 1
  fetchOriginal ??= globalThis.fetch
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (!url.startsWith('/api/itinerarios')) {
      if (fetchOriginal) return fetchOriginal(input, init)
      throw new TypeError('fetch no disponible en la prueba')
    }
    const metodo = init?.method ?? 'GET'
    const id = Number(url.match(/\/api\/itinerarios\/(\d+)/)?.[1])
    const cuerpo = init?.body ? JSON.parse(String(init.body)) as { destino: string; borrador: Record<string, unknown> } : null
    const respuesta = (status: number, data?: unknown) => new Response(data === undefined ? null : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
    const dto = (registro: RegistroItinerario) => ({ ...registro })
    if (metodo === 'GET' && !id) return respuesta(200, registros.map(dto))
    if (metodo === 'GET') {
      const item = registros.find(r => r.idItinerario === id)
      return item ? respuesta(200, dto(item)) : respuesta(404, { title: 'No encontrado' })
    }
    if (metodo === 'POST' && cuerpo) {
      const existente = registros.find(r => r.destino === cuerpo.destino && JSON.stringify(r.borrador) === JSON.stringify(cuerpo.borrador))
      if (existente) return respuesta(200, dto(existente))
      const config = cuerpo.borrador.configuracion as { fecha?: string } | undefined
      const item: RegistroItinerario = { idItinerario: siguienteId++, nombre: 'Itinerario', inicio: config?.fecha ?? '2026-01-01', fin: config?.fecha ?? '2026-01-01', guardadoEn: new Date().toISOString(), destino: cuerpo.destino, borrador: cuerpo.borrador }
      registros.push(item)
      return respuesta(201, dto(item))
    }
    if (metodo === 'PUT' && cuerpo) {
      const index = registros.findIndex(r => r.idItinerario === id)
      if (index < 0) return respuesta(404, { title: 'No encontrado' })
      const config = cuerpo.borrador.configuracion as { fecha?: string } | undefined
      registros[index] = { ...registros[index], destino: cuerpo.destino, borrador: cuerpo.borrador, inicio: config?.fecha ?? registros[index].inicio }
      return respuesta(200, dto(registros[index]))
    }
    if (metodo === 'DELETE') {
      const antes = registros.length
      registros = registros.filter(r => r.idItinerario !== id)
      return respuesta(antes === registros.length ? 404 : 204)
    }
    return respuesta(400, { title: 'Solicitud inválida' })
  }))
})

afterEach(() => cleanup())
