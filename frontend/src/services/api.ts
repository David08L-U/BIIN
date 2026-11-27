const CLAVE_TOKEN = 'biin.token'

/** Error de la API con el mensaje de ProblemDetails listo para mostrar. */
export class ApiError extends Error {
  readonly estado: number

  constructor(estado: number, mensaje: string) {
    super(mensaje)
    this.estado = estado
  }
}

export const tokenAlmacenado = {
  leer: (): string | null => {
    try {
      return localStorage.getItem(CLAVE_TOKEN)
    } catch {
      return null
    }
  },
  guardar: (token: string) => {
    try {
      localStorage.setItem(CLAVE_TOKEN, token)
    } catch {
      // Sin almacenamiento disponible: la sesión dura solo esta pestaña
    }
  },
  borrar: () => {
    try {
      localStorage.removeItem(CLAVE_TOKEN)
    } catch {
      // Nada que borrar
    }
  },
}

async function solicitar<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = tokenAlmacenado.leer()
  if (token) headers.Authorization = `Bearer ${token}`
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'

  let respuesta: Response
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa tu internet.')
  }

  if (respuesta.status === 204) return undefined as T

  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const mensaje =
      datos?.detail ??
      (datos?.errors ? Object.values(datos.errors as Record<string, string[]>).flat().join(' ') : null) ??
      datos?.title ??
      'Ocurrió un error inesperado.'
    throw new ApiError(respuesta.status, mensaje)
  }
  return datos as T
}

export const api = {
  get: <T>(ruta: string) => solicitar<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('POST', ruta, cuerpo),
  put: <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('PUT', ruta, cuerpo),
  delete: <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('DELETE', ruta, cuerpo),
}
