import FiltrosPlan from '../components/FiltrosPlan'
import CabeceraPlan from '../components/CabeceraPlan'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import ConfiguracionTicul from '../components/ConfiguracionTicul'
import ModosTicul from '../components/ModosTicul'
import Icono from '../components/IconoItinerario'
import { avisoTrasladoComidaTicul, categoriasTicul, lugaresTicul, nombreTrasladoTicul, REGRESO_TICUL, MARGEN_TICUL } from '../data/lugaresTicul'
import type { CategoriaTicul } from '../data/lugaresTicul'
import { useBorradorTicul } from '../hooks/useBorradorTicul'
import { parametrosBorradorTicul, urlBorradorTicul } from '../plan/borradorTicul'
import { calcularPlanTicul, resumirSeleccionTicul } from '../plan/itinerarioTicul'
import { duracionPlan, leerDuracion } from '../plan/duracion'
import LugaresSeleccionados from '../components/LugaresSeleccionados'
import CancelarEdicion from '../components/CancelarEdicion'
import { resumirRecorrido } from '../plan/recorridoSecuencial'

export default function PersonalizarTiculPage() {
  const { borrador, actualizar } = useBorradorTicul('personalizado')
  const navegar = useNavigate()
  const [categoria, setCategoria] = useState<CategoriaTicul>('artesanias')
  const clave = parametrosBorradorTicul(borrador).toString()
  const [intento, setIntento] = useState<{ clave: string; errores: string[] } | null>(null)
  const errores = borrador.generado ? calcularPlanTicul(borrador).errores : intento?.clave === clave ? intento.errores : []
  const resumen = resumirSeleccionTicul(borrador.seleccion)
  const finDeSemana = borrador.configuracion.estancia === 'fin-de-semana'
  const disponibles = leerDuracion(borrador.configuracion.minutosDisponibles)
  const contador = (id: CategoriaTicul) => lugaresTicul.filter(l => l.categoria === id && borrador.seleccion.includes(l.id)).length
  function restablecer() { actualizar({ seleccion: [], seleccionDia2: [], generado: false }); setIntento(null) }
  function seleccionar(id: string) {
    const esta = borrador.seleccion.includes(id)
    actualizar({ seleccion: esta ? borrador.seleccion.filter(x => x !== id) : [...borrador.seleccion, id], seleccionDia2: esta ? borrador.seleccionDia2?.filter(x => x !== id) : borrador.seleccionDia2 })
  }
  function generar(e: FormEvent) {
    e.preventDefault()
    const r = calcularPlanTicul(borrador)
    setIntento({ clave, errores: r.errores })
    if (r.plan) navegar(urlBorradorTicul('itinerario', { ...borrador, generado: true, seleccion: r.plan.seleccion, seleccionDia2: r.plan.jornadas?.[1]?.seleccion }))
  }
  return <article className="iz-plan iz-personalizar" aria-labelledby="ti-personalizar-titulo">
    <CabeceraPlan id="ti-personalizar-titulo" titulo="Personalizar Itinerario" subtitulo="Ticul · La Perla del Sur" volver={urlBorradorTicul('detalle', borrador)} personalizar acciones={<>
          <button type="button" className="iz-plan-icono-boton" aria-label="Reiniciar selección" onClick={restablecer}><Icono nombre="restart_alt" tamano={20} /></button>

        </>} />
    <div className="iz-plan-contenido"><ModosTicul borrador={borrador} />
      <form noValidate onSubmit={generar}>
        <section className="iz-plan-contexto"><h2><Icono nombre="palette" tamano={20} />Elige tus paradas en Ticul</h2><p>Combina alfarería, calzado, sabores y patrimonio. El orden seguirá tu selección.</p>
          {finDeSemana ? [1, 2].map(dia => { const ids = borrador.seleccion.filter(id => borrador.seleccionDia2?.includes(id) === (dia === 2)); const r = resumirRecorrido(lugaresTicul, ids, dia === 2 ? REGRESO_TICUL : 0, MARGEN_TICUL); const minutos = leerDuracion(dia === 1 ? borrador.configuracion.minutosDisponibles : borrador.configuracion.minutosDia2 ?? ''); return <div className="iz-plan-presupuesto iz-plan-tarjeta" role="status" aria-label={`Resumen del Día ${dia}`} key={dia}><div><span>Tiempo acumulado · Día {dia}</span><strong>{duracionPlan(r.totalMinutos)} / {minutos === null ? 'Sin configurar' : duracionPlan(minutos)}</strong></div><progress aria-label={`Tiempo utilizado del Día ${dia}`} value={Math.min(r.totalMinutos, minutos ?? 1)} max={minutos ?? 1} /><p>{duracionPlan(r.visitasMinutos)} de visitas + {duracionPlan(r.trasladosMinutos)} de traslados locales{dia === 2 ? ' y traslado final' : ''} + {duracionPlan(r.margenMinutos)} de margen.</p></div> }) : <div className="iz-plan-presupuesto iz-plan-tarjeta" role="status" aria-label="Resumen de selección" aria-live="polite"><div><span>Tiempo acumulado</span><strong>{duracionPlan(resumen.totalMinutos)} / {disponibles === null ? 'Sin configurar' : duracionPlan(disponibles)}</strong></div><progress aria-label="Tiempo utilizado" value={Math.min(resumen.totalMinutos, disponibles ?? 1)} max={disponibles ?? 1} /><p>{duracionPlan(resumen.visitasMinutos)} de visitas + {duracionPlan(resumen.trasladosMinutos)} de traslados con regreso + {duracionPlan(resumen.margenMinutos)} de margen reservado.</p><p>{disponibles === null ? 'Configura tu tiempo disponible.' : resumen.totalMinutos > disponibles ? `Excede el tiempo disponible por ${duracionPlan(resumen.totalMinutos - disponibles)}.` : `Tiempo libre: ${duracionPlan(disponibles - resumen.totalMinutos)}`}</p></div>}
        </section>
        <ConfiguracionTicul borrador={borrador} onChange={nuevo => actualizar({ ...nuevo, ...((nuevo.configuracion.estancia !== 'fin-de-semana') ? { seleccionDia2: [] } : {}) })} />
        <p className="iz-plan-nota">Información por confirmar. Precios, aperturas y acceso pendientes. Mototaxi sin disponibilidad confirmada. {avisoTrasladoComidaTicul}</p>
        <FiltrosPlan etiqueta="Categorías de lugares" opciones={categoriasTicul} activo={categoria} seleccionar={setCategoria} contador={contador} />
        <section className="iz-plan-selector" aria-labelledby="ti-categoria-titulo"><div className="iz-plan-categoria-titulo"><h2 id="ti-categoria-titulo">{categoriasTicul.find(c => c.id === categoria)!.nombre}</h2><span>{contador(categoria)} seleccionados</span></div>
          {lugaresTicul.filter(l => l.categoria === categoria).map(l => <article className="iz-plan-lugar iz-plan-tarjeta" key={l.id}><label className="iz-plan-lugar-seleccion"><input type="checkbox" aria-label={l.nombre} checked={borrador.seleccion.includes(l.id)} onChange={() => seleccionar(l.id)} /><span className="iz-plan-lugar-textos"><strong className="iz-plan-lugar-titulo">{l.nombre}</strong><span className="iz-plan-insignia">{l.etiqueta}</span></span></label><p>{l.descripcion}</p><div className="iz-plan-metadatos"><span><Icono nombre="timer" tamano={14} />Visita: {duracionPlan(l.visitaMinutos)}</span><span><Icono nombre={l.traslado.icono} tamano={14} />{nombreTrasladoTicul(l)}</span></div></article>)}
        </section>
        <LugaresSeleccionados jornadas={finDeSemana ? 2 : 1} lugares={borrador.seleccion.map(id => ({ id, nombre: lugaresTicul.find(l => l.id === id)?.nombre ?? id, dia: borrador.seleccionDia2?.includes(id) ? 2 : 1 }))} onCambiarDia={(id, dia) => actualizar({ seleccionDia2: dia === 2 ? [...new Set([...(borrador.seleccionDia2 ?? []), id])] : (borrador.seleccionDia2 ?? []).filter(x => x !== id) })} onQuitar={id => actualizar({ seleccion: borrador.seleccion.filter(elegido => elegido !== id), seleccionDia2: (borrador.seleccionDia2 ?? []).filter(x => x !== id) })} />
        <div className="iz-plan-resumen-final"><p role="status">{borrador.seleccion.length} lugares seleccionados</p><p>Los filtros conservan tu selección. Genera después de editar.</p>{errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}<CancelarEdicion editarId={borrador.editarId} /><button type="submit" className="iz-plan-primario">Generar mi itinerario<Icono nombre="arrow_forward" tamano={20} /></button><button type="button" className="iz-plan-restablecer" onClick={restablecer}><Icono nombre="restart_alt" tamano={16} />Restablecer selección</button></div>
      </form>
    </div>
  </article>
}
