import type { Plan, Destino, Actividad } from '../types/catalogo'
export function descargarPlan(
  plan: Plan,
  destino: Destino,
  actividades: Actividad[],
) {
  const datos = {
    version: 1,
    estado: 'DEMOSTRACIÓN SIN VALIDAR',
    guardadoEn: plan.actualizadoEn,
    aviso:
      'Datos del prototipo. Sin reserva de asiento ni horarios confirmados. No incluye mapas.',
    plan,
    destino,
    actividades,
  }
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(datos, null, 2)], {
      type: 'application/json;charset=utf-8',
    }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `BIIN-${destino.id}-${plan.fecha}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
