import { useConsultaApi } from '../../../hooks/useConsultaApi'
import { ApiError } from '../../../services/api'
import { idPositivo } from '../../../utils/consultaApi'
import { rutasApi } from '../api'
import { normalizarDestino } from '../datosRuta'

export async function resolverRutaApi(referencia: string, signal?: AbortSignal) {
  const id = idPositivo(referencia)
  if (id !== null) return { ruta: await rutasApi.obtener(id, signal), coincidencias: [] }
  // Compatibilidad con enlaces antiguos: resolver por la API, sin un mapa fijo de pueblos.
  if (!referencia || referencia.length > 100 || /^[-+\d]/.test(referencia)) throw new ApiError(400, 'El identificador de ruta no es válido.')
  const coincidencias = (await rutasApi.listar({ destino: referencia }, signal)).filter(r => normalizarDestino(r.destino) === normalizarDestino(referencia))
  if (!coincidencias.length) throw new ApiError(404, 'No encontramos una ruta publicada para ese destino.')
  if (coincidencias.length > 1) return { ruta: null, coincidencias }
  return { ruta: await rutasApi.obtener(coincidencias[0].idRuta, signal), coincidencias: [] }
}
export function useDetalleRutaApi(referencia: string) {
  return useConsultaApi(`ruta:${referencia}`, signal => resolverRutaApi(referencia, signal))
}
