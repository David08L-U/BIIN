import type { RutaDetalle, SalidaConCupo } from './types'

export const ordenarParadas = (ruta: RutaDetalle) => [...ruta.paradas].sort((a, b) => a.orden - b.orden)
export function tarifaCompleta(ruta: RutaDetalle): number | null {
  const paradas = ordenarParadas(ruta)
  return ruta.tarifas.find(t => t.ordenOrigen === paradas[0]?.orden && t.ordenDestino === paradas.at(-1)?.orden)?.monto ?? null
}
export function cupoVigente(salida: SalidaConCupo, ahora = Date.now()): boolean {
  return salida.estadoCupo === 'vigente' && salida.estadoSalida === 'programada' &&
    salida.asientosDisponibles !== null && salida.registradoEn !== null &&
    Date.parse(salida.registradoEn) <= ahora && salida.validoHasta !== null && Date.parse(salida.validoHasta) > ahora
}
export function normalizarDestino(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}
