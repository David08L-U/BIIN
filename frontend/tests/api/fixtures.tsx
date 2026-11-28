import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { vi } from 'vitest'
import { AuthContext, type AuthContextValor } from '../../src/features/auth/authContextValor'
import type { RutaDetalle, RutaResumen } from '../../src/features/transporte/types'
import type { RecorridoDetalle, RecorridoResumen } from '../../src/features/recorridos/types'
import type { ItinerarioDetalleDto } from '../../src/features/mi-viaje/api'

/** Datos ficticios exclusivos de pruebas; identificadores distintos de cualquier catálogo local. */
export function ruta(idRuta = 901, destino = 'Destino de prueba'): RutaDetalle {
  const parada = (orden: number, localidad: string) => ({ orden, idUbicacion: 700 + orden, direccionReferencia: `Referencia ficticia ${orden}`, latitud: 20.9 + orden / 100, longitud: -89.6, idLocalidad: 800 + orden, localidad, idMunicipio: 900 + orden, municipio: localidad, permiteAbordar: orden === 1, permiteDescender: orden !== 1 })
  return { idRuta, codigo: `PRUEBA-${idRuta}`, titulo: `[PRUEBA] Ruta a ${destino}`, descripcion: 'Ruta ficticia de pruebas', actualizadoEn: '2026-11-27T18:00:00Z', notaTarifa: 'Tarifa ficticia aproximada', fotografias: [], paradas: [parada(1, 'Origen de prueba'), parada(2, destino)], puntosRecorrido: [], horarios: [], tarifas: [], rutasRegreso: [], proximasSalidas: [] }
}
export function resumenRuta(id = 901, destino = 'Destino de prueba'): RutaResumen {
  return { idRuta: id, codigo: `PRUEBA-${id}`, titulo: `[PRUEBA] Ruta a ${destino}`, descripcion: 'Ruta ficticia', origen: 'Origen de prueba', destino, totalParadas: 2, tarifaAproximada: 0, proximaSalida: null, estadoCupo: 'no_confirmado', asientosDisponibles: null, fotoPrincipal: null, actualizadoEn: '2026-11-27T18:00:00Z' }
}
export function recorrido(id = 551, localidad = 'Destino de prueba'): RecorridoDetalle {
  return { idRecorrido: id, titulo: `[PRUEBA] Visita ${localidad}`, descripcion: 'Recorrido ficticio', idLocalidadBase: 802, localidadBase: localidad, idMunicipio: 902, municipio: localidad, duracionTotalMin: 75, actualizadoEn: '2026-11-27T18:00:00Z', etapas: [
    { orden: 1, idRecurso: 721, tipo: 'lugar', titulo: '[PRUEBA] Museo', descripcion: 'Museo ficticio', duracionSugeridaMin: 45, latitud: null, longitud: null, localidad, fotoPrincipal: null, disponible: true, aviso: null },
    { orden: 2, idRecurso: 722, tipo: 'negocio', titulo: '[PRUEBA] Cocina', descripcion: 'Cocina ficticia', duracionSugeridaMin: 30, latitud: null, longitud: null, localidad, fotoPrincipal: null, disponible: true, aviso: null },
  ] }
}
export function resumenRecorrido(id = 551): RecorridoResumen {
  const { etapas, ...r } = recorrido(id)
  return { ...r, totalEtapas: etapas.length, fotoPrincipal: null }
}
export function itinerario(id = 345): ItinerarioDetalleDto {
  return { idItinerario: id, nombre: '[PRUEBA] Mi visita', inicio: '2026-12-01', fin: '2026-12-02', presupuestoEstimado: 0, fechaCreacion: '2026-11-27T18:00:00Z', advertencias: [], actividades: recorrido().etapas.map((e, i) => ({ idActividad: 1001 + i, orden: i + 1, idRecurso: e.idRecurso, tipo: e.tipo, titulo: e.titulo, disponible: true, inicioPrevisto: null, finPrevisto: null, notas: null, localidad: e.localidad, latitud: null, longitud: null, trasladoDesdeAnterior: null })) }
}
export const pagina = <T,>(items: T[]) => ({ items, total: items.length, pagina: 1, tamano: 100 })
export function simularApi(resolver: (url: URL, init: RequestInit) => unknown | Promise<unknown>) {
  const fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const respuesta = await resolver(new URL(String(input), 'https://biin.test'), init)
    return respuesta instanceof Response ? respuesta : new Response(JSON.stringify(respuesta), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}
export function contexto(idUsuario: number | null = 1): AuthContextValor {
  return { usuario: idUsuario === null ? null : { idUsuario, nombre: `Viajero ${idUsuario}`, correo: `prueba${idUsuario}@biin.test`, roles: ['viajero'] }, cargando: false, errorRestauracion: null, reintentarRestauracion: vi.fn(), iniciarSesion: vi.fn(), registrarse: vi.fn(), verificarRegistro: vi.fn(), reenviarCodigo: vi.fn(), cerrarSesion: vi.fn(), tieneRol: rol => rol === 'viajero' }
}
export function montar(elemento: ReactElement, path: string, entrada: string, auth = contexto(), extras: RouteObject[] = []) {
  const router = createMemoryRouter([{ path, element: elemento }, ...extras], { initialEntries: [entrada] })
  const vista = render(<AuthContext.Provider value={auth}><RouterProvider router={router} /></AuthContext.Provider>)
  return { ...vista, router, auth }
}
