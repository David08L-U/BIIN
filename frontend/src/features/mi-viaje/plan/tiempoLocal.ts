/** Fechas de calendario y horas del navegador; YYYY-MM-DD nunca se lee como UTC. */
export interface InicioLocal { fecha: string; horaInicio: string }

export function inicioLocal(config: InicioLocal): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.fecha) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(config.horaInicio)) return null
  const [ano, mes, dia] = config.fecha.split('-').map(Number)
  const [hora, minuto] = config.horaInicio.split(':').map(Number)
  if (ano < 1000 || ano > 9999) return null
  const fecha = new Date(ano, mes - 1, dia, hora, minuto)
  return fecha.getFullYear() === ano && fecha.getMonth() === mes - 1 && fecha.getDate() === dia && fecha.getHours() === hora && fecha.getMinutes() === minuto ? fecha : null
}

export function fechaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export function siguienteFechaLocal(fecha: string): string {
  const actual = inicioLocal({ fecha, horaInicio: '12:00' })
  if (!actual) return ''
  // Sumar un día de calendario conserva la fecha consecutiva incluso con cambios de zona/DST.
  actual.setDate(actual.getDate() + 1)
  return actual.getFullYear() <= 9999 ? fechaLocal(actual) : ''
}

export function instanteLocal(config: InicioLocal, minutos: number): Date {
  const inicio = inicioLocal(config)
  if (!inicio) throw new Error('Configuración de fecha y hora inválida.')
  return new Date(inicio.getTime() + minutos * 60_000)
}

export function horaLocal(config: InicioLocal, minutos: number): string {
  const fecha = instanteLocal(config, minutos)
  const inicio = inicioLocal(config)!
  return fecha.toLocaleString(undefined, {
    ...(fecha.toDateString() !== inicio.toDateString() ? { day: '2-digit', month: 'short' } as const : {}),
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}
