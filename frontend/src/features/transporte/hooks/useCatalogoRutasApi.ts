import { useConsultaApi } from '../../../hooks/useConsultaApi'
import { rutasApi } from '../api'
import { normalizarDestino } from '../datosRuta'

/** RF02: filtros sobre el catálogo completo publicado, sin limitarse a cinco destinos. */
export function useCatalogoRutasApi(busqueda = '', filtro = 'todas', destino = '') {
  return useConsultaApi(`catalogo:${busqueda}:${filtro}:${destino}`, async signal => {
    const rutas = await rutasApi.listar({ busqueda: busqueda.trim(), destino }, signal)
    return rutas.filter(r => (filtro !== 'directos' || r.totalParadas === 2) &&
      (filtro !== 'cenotes' || normalizarDestino(`${r.titulo} ${r.descripcion ?? ''}`).includes('cenote')))
  })
}
