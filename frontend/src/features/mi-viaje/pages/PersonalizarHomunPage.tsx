import FiltrosPlan from '../components/FiltrosPlan'
import CabeceraPlan from '../components/CabeceraPlan'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import ConfiguracionHomun from '../components/ConfiguracionHomun'
import ModosHomun from '../components/ModosHomun'
import Icono from '../components/IconoItinerario'
import { avisoRegresoHomun, categoriasHomun, lugaresHomun, nombreTrasladoHomun } from '../data/lugaresHomun'
import type { CategoriaHomun } from '../data/lugaresHomun'
import { useBorradorHomun } from '../hooks/useBorradorHomun'
import { parametrosBorradorHomun, urlBorradorHomun } from '../plan/borradorHomun'
import { calcularPlanHomun, resumirJornadaHomun, ventanasHomun } from '../plan/itinerarioHomun'
import { duracionPlan, leerDuracion } from '../plan/duracion'
import LugaresSeleccionados from '../components/LugaresSeleccionados'
import CancelarEdicion from '../components/CancelarEdicion'

export default function PersonalizarHomunPage() {
  const { borrador, actualizar } = useBorradorHomun('personalizado')
  const navegar = useNavigate()
  const [categoria, setCategoria] = useState<CategoriaHomun>('cenotes')
  const clave = parametrosBorradorHomun(borrador).toString()
  const [intento, setIntento] = useState<{ clave: string; errores: string[] } | null>(null)
  const errores = borrador.generado ? calcularPlanHomun(borrador).errores : intento?.clave === clave ? intento.errores : []
  const ventanas = ventanasHomun(borrador.configuracion)
  const contador = (id: CategoriaHomun) => lugaresHomun.filter(l => l.categoria === id && borrador.seleccion.some(s => s.lugarId === l.id)).length
  function seleccionar(lugarId: string) {
    actualizar({ seleccion: borrador.seleccion.some(s => s.lugarId === lugarId) ? borrador.seleccion.filter(s => s.lugarId !== lugarId) : [...borrador.seleccion, { lugarId, dia: 1 }] })
  }
  function restablecer() { actualizar({ seleccion: [], generado: false }); setIntento(null) }
  function generar(e: FormEvent) {
    e.preventDefault()
    const r = calcularPlanHomun(borrador)
    setIntento({ clave, errores: r.errores })
    if (r.plan) navegar(urlBorradorHomun('itinerario', { ...borrador, generado: true, seleccion: r.plan.seleccion }))
  }
  return <article className="iz-plan iz-personalizar" aria-labelledby="hm-personalizar-titulo">
    <CabeceraPlan id="hm-personalizar-titulo" titulo="Personalizar Itinerario" subtitulo="Homún · Anillo de Cenotes" volver={urlBorradorHomun('detalle', borrador)} personalizar acciones={<>
          <button type="button" className="iz-plan-icono-boton" aria-label="Reiniciar selección" onClick={restablecer}><Icono nombre="restart_alt" tamano={20} /></button>

        </>} />
    <div className="iz-plan-contenido">
      <ModosHomun borrador={borrador} />
      <form noValidate onSubmit={generar}>
        <section className="iz-plan-contexto"><h2><Icono nombre="water_drop" tamano={20} />Elige tu circuito en Homún</h2><p>Selecciona tus lugares por categoría. Para fin de semana, asigna cada visita a una jornada. El orden sigue tu selección dentro de cada día.</p>
          {ventanas.map(v => {
            const r = resumirJornadaHomun(borrador.seleccion.filter(s => s.dia === v.dia).map(s => s.lugarId))
            const disponibles = leerDuracion(v.minutosDisponibles)
            return <div className="iz-plan-presupuesto iz-plan-tarjeta" key={v.dia} role="status" aria-label={`Resumen del Día ${v.dia}`}>
              <div><span>Día {v.dia} · Tiempo acumulado</span><strong>{duracionPlan(r.totalMinutos)} / {disponibles === null ? 'Sin configurar' : duracionPlan(disponibles)}</strong></div>
              <progress aria-label={`Tiempo utilizado del Día ${v.dia}`} value={Math.min(r.totalMinutos, disponibles ?? 1)} max={disponibles ?? 1} />
              <p>{duracionPlan(r.visitasMinutos)} de visitas + {duracionPlan(r.trasladosMinutos)} de traslados con regreso + {duracionPlan(r.margenMinutos)} de margen reservado.</p>
              <p>{disponibles === null ? 'Configura el tiempo de esta jornada.' : r.totalMinutos > disponibles ? `Excede el tiempo disponible por ${duracionPlan(r.totalMinutos - disponibles)}.` : `Tiempo libre: ${duracionPlan(disponibles - r.totalMinutos)}`}</p>
            </div>
          })}
        </section>
        <ConfiguracionHomun borrador={borrador} onChange={actualizar} />
        <p className="iz-plan-nota">Información por confirmar. Mototaxi sin precio ni disponibilidad; no está contratado. {avisoRegresoHomun}</p>
        <FiltrosPlan etiqueta="Categorías de lugares" opciones={categoriasHomun} activo={categoria} seleccionar={setCategoria} contador={contador} />
        <section className="iz-plan-selector" aria-labelledby="hm-categoria-titulo">
          <div className="iz-plan-categoria-titulo"><h2 id="hm-categoria-titulo">{categoriasHomun.find(c => c.id === categoria)!.nombre}</h2><span>{contador(categoria)} seleccionados</span></div>
          {lugaresHomun.filter(l => l.categoria === categoria).map(l => {
            const elegida = borrador.seleccion.find(s => s.lugarId === l.id)
            return <article key={l.id} className="iz-plan-lugar iz-plan-tarjeta">
              <label className="iz-plan-lugar-seleccion"><input type="checkbox" aria-label={l.nombre} checked={!!elegida} onChange={() => seleccionar(l.id)} /><span className="iz-plan-lugar-textos"><strong className="iz-plan-lugar-titulo">{l.nombre}</strong><span className="iz-plan-insignia">{l.etiqueta}</span></span></label>
              <p>{l.descripcion}</p><div className="iz-plan-metadatos"><span><Icono nombre="timer" tamano={14} />Visita: {duracionPlan(l.visitaMinutos)}</span><span><Icono nombre={l.traslado.icono} tamano={14} />{nombreTrasladoHomun(l)}</span></div>
            </article>
          })}
        </section>
        <LugaresSeleccionados jornadas={ventanas.length} lugares={borrador.seleccion.map(s => ({ id: s.lugarId, nombre: lugaresHomun.find(l => l.id === s.lugarId)?.nombre ?? s.lugarId, dia: s.dia }))} onQuitar={id => actualizar({ seleccion: borrador.seleccion.filter(s => s.lugarId !== id) })} onCambiarDia={(id, dia) => actualizar({ seleccion: borrador.seleccion.map(s => s.lugarId === id ? { ...s, dia } : s) })} />
        <div className="iz-plan-resumen-final"><p role="status">{borrador.seleccion.length} lugares seleccionados</p><p>Los filtros conservan tu selección. Genera después de editar; aún no se ha guardado un plan.</p>
          {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
          <CancelarEdicion editarId={borrador.editarId} /><button type="submit" className="iz-plan-primario">Generar mi itinerario<Icono nombre="arrow_forward" tamano={20} /></button>
          <button type="button" className="iz-plan-restablecer" onClick={restablecer}><Icono nombre="restart_alt" tamano={16} />Restablecer selección</button>
        </div>
      </form>
    </div>
  </article>
}
