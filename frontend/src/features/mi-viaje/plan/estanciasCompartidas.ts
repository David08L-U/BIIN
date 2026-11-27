export const estanciasCompartidas = {
  'medio-dia': { nombre: 'Medio día', minutos: '270', hora: '09:00' },
  'dia-completo': { nombre: 'Día completo', minutos: '540', hora: '09:00' },
  'fin-de-semana': { nombre: 'Fin de semana · 2 días', minutos: '540', hora: '09:00' },
} as const

export type EstanciaCompartida = keyof typeof estanciasCompartidas

export function esEstanciaCompartida(valor: string): valor is EstanciaCompartida {
  return Object.hasOwn(estanciasCompartidas, valor)
}
