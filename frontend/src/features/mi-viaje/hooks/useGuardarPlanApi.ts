import { useEffect, useRef, useState } from 'react'
import { tokenAlmacenado } from '../../../services/api'
import { itinerariosApi } from '../api'
import type { RecorridoDetalle } from '../../recorridos/types'
import { datosCrearPlan, type ConfiguracionPlanApi } from '../plan/planApi'

/** Cada escritura devuelve el estado del servidor; un fallo parcial conserva el id para recuperarlo. RF09. */
export function useGuardarPlanApi() {
  const ocupado = useRef(false)
  const vivo = useRef(true)
  useEffect(() => { vivo.current = true; return () => { vivo.current = false } }, [])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parcial, setParcial] = useState<number | null>(null)
  const [incierto, setIncierto] = useState(false)
  async function guardar(recorrido: RecorridoDetalle, config: ConfiguracionPlanApi, seleccion: number[], personalizado: boolean) {
    if (ocupado.current || parcial !== null || incierto) return null
    ocupado.current = true; setGuardando(true); setError(null)
    let idCreado: number | null = null
    const tokenInicial = tokenAlmacenado.leer()
    const vigente = () => vivo.current && tokenAlmacenado.leer() === tokenInicial
    try {
      if (!personalizado) {
        const resultado = await itinerariosApi.crearDesdeRecorrido(recorrido.idRecorrido, { ...datosCrearPlan(config), horaInicioLocal: `${config.horaInicio}:00` })
        return vigente() ? resultado : null
      }
      let resultado = await itinerariosApi.crear(datosCrearPlan(config))
      idCreado = resultado.idItinerario
      for (const orden of seleccion) {
        if (!vigente()) return null
        const etapa = recorrido.etapas.find(e => e.orden === orden && e.disponible)
        if (!etapa) throw new Error('Una actividad dejó de estar disponible. Revisa el itinerario guardado.')
        resultado = await itinerariosApi.agregarActividad(idCreado, { idRecurso: etapa.idRecurso })
      }
      return vigente() ? resultado : null
    } catch (e) {
      setParcial(idCreado)
      // Una desconexión después de POST no demuestra que el servidor no haya guardado.
      const desconocido = idCreado === null && (!(e instanceof Error) || !('estado' in e) || e.estado === 0 || (typeof e.estado === 'number' && e.estado >= 500))
      setIncierto(desconocido)
      setError(`${e instanceof Error ? e.message : 'No se pudo guardar.'}${idCreado !== null ? ' El itinerario se creó parcialmente. Ábrelo para completar las actividades; no vuelvas a crearlo.' : desconocido ? ' No pudimos confirmar el resultado. Revisa Mis itinerarios antes de volver a crear uno.' : ''}`)
      return null
    } finally { ocupado.current = false; setGuardando(false) }
  }
  return { guardar, guardando, error, parcial, incierto }
}
