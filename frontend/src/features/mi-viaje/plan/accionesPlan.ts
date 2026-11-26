export interface AvisoCompartir { estado: 'compartido' | 'copiado' | 'manual' | 'cancelado'; mensaje: string }

export async function compartirPlan(url: string, title: string): Promise<AvisoCompartir> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: 'Vista previa estimada del plan de visita.', url })
      return { estado: 'compartido', mensaje: 'Vista previa compartida.' }
    } catch (error) {
      // DOMException puede proceder de otro contexto y no ser instanceof Error.
      if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError') return { estado: 'cancelado', mensaje: 'Se canceló compartir. El plan no ha cambiado.' }
    }
  }
  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(url)
      return { estado: 'copiado', mensaje: 'Enlace de la vista previa copiado.' }
    }
  } catch { /* Ofrece copia manual sin anunciar éxito. */ }
  return { estado: 'manual', mensaje: 'No se pudo compartir ni copiar automáticamente. Selecciona el enlace y cópialo con el teclado o el menú del navegador.' }
}

export function descargarTextoPlan(texto: string, nombre: string): void {
  const archivo = new Blob([texto], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  try {
    enlace.href = url
    enlace.download = nombre
    document.body.append(enlace)
    enlace.click()
  } finally {
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}
