/** Nunca intercepta API, JWT ni teselas. Solo se registra en la compilación. */
export function registrarPwa() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* La app sigue funcionando en línea si no es posible instalarla. */
      })
    })
  }
  try {
    document.documentElement.dataset.contraste = String(
      localStorage.getItem('biin.contraste') === 'true',
    )
  } catch {
    /* Preferencias predeterminadas sin almacenamiento. */
  }
}
