import type { NavigateFunction } from 'react-router'

/** Accepts only local absolute paths so return state cannot leave BIIN. */
export function destinoInterno(destino: unknown, respaldo: string): string {
  const esLocal = (valor: unknown): valor is string =>
    typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//')

  if (esLocal(destino)) return destino
  return esLocal(respaldo) ? respaldo : '/'
}

/** Uses browser Back only when the browser has an in-app entry to return to. */
export function regresarEnBIIN(
  navegar: NavigateFunction,
  contexto: unknown,
  respaldo: string,
  indiceHistorial: unknown = window.history.state?.idx,
) {
  const destino = destinoInterno(contexto, respaldo)

  if (typeof indiceHistorial === 'number' && indiceHistorial > 0) {
    navegar(-1)
    return
  }

  navegar(destino, { replace: true })
}
