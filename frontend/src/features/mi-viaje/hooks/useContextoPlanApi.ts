import { useConsultaApi } from '../../../hooks/useConsultaApi'
import { ApiError } from '../../../services/api'
import { idPositivo } from '../../../utils/consultaApi'
import { resolverRutaApi } from '../../transporte/hooks/useDetalleRutaApi'
import { ordenarParadas } from '../../transporte/datosRuta'
import { recorridosApi } from '../../recorridos/api'

export async function cargarContextoPlanApi(referenciaRuta: string | undefined, referenciaRecorrido: string | undefined, seleccionRecorrido: string | null, signal?: AbortSignal) {
  if (referenciaRecorrido !== undefined) {
    const id = idPositivo(referenciaRecorrido)
    if (id === null) throw new ApiError(400, 'El identificador del recorrido no es válido.')
    const recorrido = await recorridosApi.obtener(id, signal)
    return { ruta: null, opciones: [], recorrido }
  }
  const { ruta, coincidencias } = await resolverRutaApi(referenciaRuta ?? '', signal)
  if (!ruta) throw new ApiError(400, `Hay ${coincidencias.length} rutas para ese destino. Elige una desde el catálogo de rutas.`)
  const localidad = ordenarParadas(ruta).at(-1)?.idLocalidad
  const opciones = localidad ? await recorridosApi.listar({ idLocalidadBase: localidad }, signal) : []
  const elegido = seleccionRecorrido === null ? opciones[0]?.idRecorrido : idPositivo(seleccionRecorrido)
  if (seleccionRecorrido !== null && !opciones.some(r => r.idRecorrido === elegido)) throw new ApiError(404, 'Ese recorrido no pertenece al destino seleccionado o ya no está publicado.')
  const recorrido = elegido ? await recorridosApi.obtener(elegido, signal) : null
  if (recorrido && recorrido.idLocalidadBase !== localidad) throw new ApiError(404, 'El recorrido cambió de destino. Vuelve a elegirlo.')
  return { ruta, opciones, recorrido }
}
export function useContextoPlanApi(ruta: string | undefined, recorrido: string | undefined, seleccion: string | null) {
  return useConsultaApi(`plan:${ruta}:${recorrido}:${seleccion}`, signal => cargarContextoPlanApi(ruta, recorrido, seleccion, signal))
}
