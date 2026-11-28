import { useEffect, useReducer, useState } from 'react'

export interface ConsultaApi<T> {
  datos: T | null; cargando: boolean; error: string | null; reintentar: () => void
}

/** Descarta respuestas viejas y limpia los datos al cambiar de destino/cuenta. RNF07. */
export function useConsultaApi<T>(clave: string, consultar: (signal: AbortSignal) => Promise<T>): ConsultaApi<T> {
  const [intento, reintentar] = useReducer(n => n + 1, 0)
  const [estado, setEstado] = useState<{ clave: string; intento: number; datos: T | null; error: string | null }>({ clave: '', intento: -1, datos: null, error: null })
  useEffect(() => {
    const controlador = new AbortController()
    // La clave incluye todos los parámetros de la consulta; la función puede cambiar de identidad.
    void Promise.resolve().then(() => consultar(controlador.signal)).then(datos => {
      if (!controlador.signal.aborted) setEstado({ clave, intento, datos, error: null })
    }).catch(error => {
      if (!controlador.signal.aborted) setEstado({ clave, intento, datos: null, error: error instanceof Error ? error.message : 'No se pudo cargar la información.' })
    })
    return () => controlador.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento])
  const vigente = estado.clave === clave && estado.intento === intento
  return { datos: vigente ? estado.datos : null, error: vigente ? estado.error : null, cargando: !vigente, reintentar }
}
