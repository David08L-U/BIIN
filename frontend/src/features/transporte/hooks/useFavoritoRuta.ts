import { useState } from 'react'

/** Preferencia de este navegador. No representa favoritos de una cuenta. */
export function useFavoritoRuta(id: string) {
  const clave = `biin:favorito-ruta:${id}`
  const [estado, setEstado] = useState(() => {
    try {
      return { favorito: localStorage.getItem(clave) === 'true', error: false }
    } catch {
      return { favorito: false, error: true }
    }
  })

  function alternarFavorito() {
    const favorito = !estado.favorito

    try {
      localStorage.setItem(clave, String(favorito))
      setEstado({ favorito, error: false })
    } catch {
      setEstado({ favorito, error: true })
    }
  }

  return {
    favorito: estado.favorito,
    alternarFavorito,
    aviso: estado.error
      ? 'No se pudo acceder al almacenamiento del navegador. La preferencia solo durará mientras esta página esté abierta.'
      : 'La preferencia de favorito se guarda solo en este navegador, sin sincronización con una cuenta.',
  }
}
