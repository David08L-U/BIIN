import { destinosDemo } from '../features/transporte/demo/destinos'
import { actividadesDemo } from '../features/exploracion/demo/actividades'
// Adaptador explícito: sustituir por endpoints documentados cuando existan en la API.
export const modoDemo = import.meta.env.VITE_CATALOGO_DEMO !== 'false'
export const destinos = modoDemo ? destinosDemo : []
export const actividades = modoDemo ? actividadesDemo : []
export const buscarDestino = (id: string | undefined) => destinos.find(d=>d.id===id)
