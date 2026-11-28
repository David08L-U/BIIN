import type { PaginaResultado } from '../types/paginacion'

export function consultaApi(filtros: Record<string, string | number | undefined>): string {
  const parametros = new URLSearchParams()
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== '') parametros.set(clave, String(valor))
  }
  return parametros.size ? `?${parametros}` : ''
}

export function idPositivo(valor: string | undefined | null): number | null {
  if (!valor || !/^[1-9]\d*$/.test(valor)) return null
  const numero = Number(valor)
  return Number.isSafeInteger(numero) && numero <= 2147483647 ? numero : null
}

/** No confundir la primera página con todo el catálogo. RNF08. */
export async function todasLasPaginas<T>(leer: (pagina: number) => Promise<PaginaResultado<T>>): Promise<T[]> {
  const items: T[] = []
  for (let pagina = 1; ; pagina++) {
    const respuesta = await leer(pagina)
    items.push(...respuesta.items)
    if (items.length >= respuesta.total) return items
    if (!respuesta.items.length || respuesta.pagina !== pagina) {
      throw new Error('El catálogo cambió durante la consulta. Vuelve a intentarlo.')
    }
  }
}
