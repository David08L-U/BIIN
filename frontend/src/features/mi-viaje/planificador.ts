import type { Actividad } from '../../types/catalogo'
import { minutosDeHora, horaDeMinutos } from '../../utils/formato'
export const tiempoTotal=(actividades:Actividad[])=>actividades.reduce((s,a)=>s+a.minutos+a.traslado,0)
export function programar(actividades:Actividad[],inicio:string) {
 let hora=minutosDeHora(inicio)
 return actividades.map(a=>{hora+=a.traslado; const desde=horaDeMinutos(hora);hora+=a.minutos;return {actividad:a,desde,hasta:horaDeMinutos(hora)}})
}
export function validarPlan(actividades:Actividad[],inicio:string,limite:number,fecha:string) {
 if(!actividades.length)return 'Selecciona al menos una actividad.'
 if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha))return 'Selecciona la fecha de tu visita.'
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(inicio))return 'Selecciona una hora válida.'
 if(![180,270,480].includes(limite))return 'Selecciona una duración válida.'
 if(tiempoTotal(actividades)+30>limite)return 'Las actividades y traslados superan tu estancia. Reserva 30 minutos para regresar al paradero.'
 if(minutosDeHora(inicio)+limite>=24*60)return 'Tu visita cruza la medianoche. Elige una hora de inicio más temprana.'
 return null
}
