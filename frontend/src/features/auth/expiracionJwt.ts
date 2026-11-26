/** Reads exp only to schedule a validation request; authorization remains server-side. */
export function expiracionJwtEnMs(token: string): number | null {
  try {
    const segmento = token.split('.')[1]
    if (!segmento) return null
    const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/')
    const normalizado = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const exp = JSON.parse(atob(normalizado))?.exp
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null
  } catch {
    return null
  }
}
