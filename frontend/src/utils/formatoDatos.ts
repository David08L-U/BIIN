/** El transporte y los itinerarios se muestran en hora de Yucatán. RF03 / RF09. */
const zona = 'America/Merida'
export const moneda = (valor: number | null | undefined) => valor == null ? 'Sin confirmar' :
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(valor)
export function fechaHora(valor: string | null | undefined): string {
  if (!valor || !Number.isFinite(Date.parse(valor))) return 'Sin fecha confirmada'
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: zona }).format(new Date(valor))
}
export function entradaYucatan(valor: string): string {
  const fecha = new Date(valor)
  if (!Number.isFinite(fecha.getTime())) return ''
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(fecha)
  const parte = (tipo: string) => partes.find(p => p.type === tipo)?.value
  return `${parte('year')}-${parte('month')}-${parte('day')}T${parte('hour')}:${parte('minute')}`
}
export const hoyYucatan = () => entradaYucatan(new Date().toISOString()).slice(0, 10)
export function fechaValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const fecha = new Date(`${valor}T12:00:00Z`)
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
}
export function aUtcYucatan(valor: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(valor) || !fechaValida(valor.slice(0, 10))) return null
  return new Date(`${valor}:00-06:00`).toISOString()
}
