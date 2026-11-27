import { createElement, type ComponentType, type ReactNode } from 'react'
import type { CapacidadPlanificador, PantallaDestino } from '../../destinos/contratos'
import type { BorradorGuardable } from '../api/itinerariosApi'
import type { JornadaPlan, VentanaJornada, VisitaJornada } from './recorridoJornadas'
import type { PlanIzamal } from './itinerarioIzamal'

interface Resumen {
  totalMinutos: number
  visitasMinutos: number
  trasladosMinutos: number
  margenMinutos: number
}

export interface LugarPlanificador {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  etiqueta: string
  icono?: string
  visitaMinutos: number
  trasladoMinutos: number
  trasladoTexto?: string
  trasladoIcono?: string
}

export interface DatosPlanificador {
  nombre: string
  subtitulo: string
  contexto: string
  nota: string
  icono: string
  categoriaInicial: string
  categorias: readonly { id: string; nombre: string; titulo?: string; icono?: string }[]
  filtros: readonly { id: string; nombre: string }[]
  lugares: readonly LugarPlanificador[]
  categoriaRecorrido?: (lugar: { categoria?: string }) => string
  consejos: { icono: string; titulo: string; descripcion: string }[]
  recorrido: string
  lista?: string
  inicio: string
  mostrarDia?: boolean
  cierreEnLista?: boolean
  enlaceManual?: boolean
  etiquetaCompartir?: string
  etiquetaTraslados: string
  estancia: (id: string) => string
  tituloEstancia?: string
  guardar: string
}

interface Adaptador<D extends BorradorGuardable, P> extends CapacidadPlanificador<D, P> {
  calcular(borrador: D, hoy?: string): { plan: P | null; errores: string[] }
  conservarSeleccionRecomendada?: boolean
  url(pantalla: PantallaDestino, borrador: D): string
  Configuracion: ComponentType<{ borrador: D; onChange: (borrador: D) => void }>
  seleccion(borrador: D): VisitaJornada[]
  cambiarSeleccion(borrador: D, seleccion: VisitaJornada[]): D
  ventanas(borrador: D): VentanaJornada[]
  resumen(ids: string[], incluirRegreso: boolean): Resumen
  jornadas(borrador: D, plan: P): JornadaPlan[]
  aplicar(borrador: D, plan: P): D
  descargar(borrador: D, plan: P): void
}

export function adaptarPlanificador<D extends BorradorGuardable, P>(datos: DatosPlanificador, adaptador: Adaptador<D, P>) {
  return {
    datos,
    leer(parametros: URLSearchParams, pantalla: PantallaDestino) {
      const borrador = adaptador.leer(parametros, pantalla === 'personalizar' ? 'personalizado' : undefined)
      const seleccionarModo = (modo: D['modo']) => ({ ...borrador, modo, generado: false })
      return {
        borrador,
        clave: adaptador.serializar(borrador).toString(),
        seleccion: adaptador.seleccion(borrador),
        ventanas: adaptador.ventanas(borrador),
        resumen: adaptador.resumen,
        cambiarSeleccion: (seleccion: VisitaJornada[]) =>
          adaptador.serializar({ ...adaptador.cambiarSeleccion(borrador, seleccion), generado: false }),
        configuracion: (actualizar: (parametros: URLSearchParams) => void): ReactNode =>
          createElement(adaptador.Configuracion, {
            borrador,
            onChange: nuevo => {
              const pasaAUnaJornada = borrador.configuracion.estancia === 'fin-de-semana' && nuevo.configuracion.estancia !== 'fin-de-semana'
              const vigente = pasaAUnaJornada
                ? adaptador.cambiarSeleccion(nuevo, adaptador.seleccion(nuevo).map(visita => ({ ...visita, dia: 1 })))
                : nuevo
              actualizar(adaptador.serializar({ ...vigente, generado: false }))
            },
          }),
        urlDetalle: adaptador.url('detalle', borrador),
        recomendado: adaptador.url('itinerario', seleccionarModo('recomendado')),
        personalizar: adaptador.url('personalizar', seleccionarModo('personalizado')),
        calcular(hoy?: string) {
          const { plan, errores } = adaptador.calcular(borrador, hoy)
          if (!plan) return { plan: null, errores }
          const vigente = { ...adaptador.aplicar(borrador, plan), generado: true }
          return {
            errores,
            plan: {
              vigente,
              jornadas: adaptador.jornadas(borrador, plan),
              parametros: adaptador.serializar(adaptador.conservarSeleccionRecomendada && borrador.modo === 'recomendado'
                ? { ...borrador, generado: true } : vigente),
              url: adaptador.url('itinerario', vigente),
              editar: adaptador.url('personalizar', { ...vigente, modo: 'personalizado', generado: false }),
              guardado: (id: string) => adaptador.serializar({ ...vigente, editarId: id }),
              descargar: () => adaptador.descargar(vigente, plan),
            },
          }
        },
      }
    },
  }
}

export type Planificador = ReturnType<typeof adaptarPlanificador<BorradorGuardable, unknown>>

type BorradorSecuencial = Extract<BorradorGuardable, { seleccion: string[] }>

export function seleccionSecuencial(borrador: BorradorSecuencial): VisitaJornada[] {
  return borrador.seleccion.map(lugarId => ({
    lugarId,
    dia: borrador.seleccionDia2?.includes(lugarId) ? 2 : 1,
  }))
}

export function cambiarSeleccionSecuencial<D extends BorradorSecuencial>(borrador: D, seleccion: VisitaJornada[]): D {
  return {
    ...borrador,
    seleccion: seleccion.map(visita => visita.lugarId),
    seleccionDia2: seleccion.filter(visita => visita.dia === 2).map(visita => visita.lugarId),
  }
}

export function aplicarPlanSecuencial<D extends BorradorSecuencial>(borrador: D, plan: PlanIzamal): D {
  return { ...borrador, seleccion: plan.seleccion, seleccionDia2: plan.jornadas?.[1]?.seleccion ?? [] }
}

export function jornadasSecuenciales(borrador: BorradorSecuencial, plan: PlanIzamal): JornadaPlan[] {
  return plan.jornadas ?? [{ ...borrador.configuracion, ...plan, dia: 1 }]
}
