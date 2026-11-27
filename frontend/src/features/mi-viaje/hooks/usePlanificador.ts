import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { Planificador } from '../plan/adaptarPlanificador'
import { fechaPasadaLocal } from '../plan/tiempoLocal'

export function usePlanificador(adaptador: Planificador, pantalla: 'itinerario' | 'personalizar') {
  const [parametros, setParametros] = useSearchParams()
  const navegar = useNavigate()
  const sesion = adaptador.leer(parametros, pantalla)
  const [intento, setIntento] = useState<{ clave: string; errores: string[] } | null>(null)
  const fecha = sesion.borrador.configuracion.fecha
  const historico = pantalla === 'itinerario' && sesion.borrador.generado && fechaPasadaLocal(fecha)
  const resultado = sesion.borrador.generado ? sesion.calcular(historico ? fecha : undefined) : null

  function actualizar(nuevos: URLSearchParams) {
    setIntento(null)
    setParametros(nuevos, { replace: true })
  }

  function generar(evento: FormEvent) {
    evento.preventDefault()
    const calculo = sesion.calcular()
    if (!calculo.plan) {
      setIntento({ clave: sesion.clave, errores: calculo.errores })
      return
    }
    if (pantalla === 'personalizar') navegar(calculo.plan.url)
    else actualizar(calculo.plan.parametros)
  }

  return {
    ...sesion,
    plan: resultado?.plan ?? null,
    historico,
    errores: resultado?.errores ?? (intento?.clave === sesion.clave ? intento.errores : []),
    actualizar,
    generar,
  }
}
