import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import ConfiguracionHomun from '../components/ConfiguracionHomun'
import ModosHomun from '../components/ModosHomun'
import Icono from '../components/IconoItinerario'
import { avisoRegresoHomun, categoriasHomun, lugaresHomun, nombreTrasladoHomun } from '../data/lugaresHomun'
import type { CategoriaHomun } from '../data/lugaresHomun'
import { useBorradorHomun } from '../hooks/useBorradorHomun'
import { parametrosBorradorHomun, urlBorradorHomun } from '../plan/borradorHomun'
import { calcularPlanHomun, resumirJornadaHomun, ventanasHomun } from '../plan/itinerarioHomun'
import { duracionPlan } from '../plan/itinerarioIzamal'
import '../../../styles/itinerario-homun.css'

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
  return <article className="hm-plan hm-personalizar" aria-labelledby="hm-personalizar-titulo">
    <header className="hm-cabecera">
      <Link className="hm-icono-boton" to={urlBorradorHomun('detalle', borrador)} aria-label="Volver a detalle de ruta"><Icono nombre="arrow_back" tamano={20} /></Link>
      <div className="hm-titulo"><p className="hm-ceja">Homún · Anillo de Cenotes</p><h1 id="hm-personalizar-titulo">Personalizar Itinerario</h1></div>
      <button type="button" className="hm-icono-boton" aria-label="Reiniciar selección" onClick={restablecer}><Icono nombre="restart_alt" tamano={20} /></button>
    </header>
    <div className="hm-contenido">
      <ModosHomun borrador={borrador} />
      <form noValidate onSubmit={generar}>
        <section className="hm-contexto"><h2><Icono nombre="water_drop" tamano={20} />Elige tu circuito en Homún</h2><p>Selecciona tus lugares por categoría. Para fin de semana, asigna cada visita a una jornada. El orden sigue tu selección dentro de cada día.</p>
          {ventanas.map(v => {
            const r = resumirJornadaHomun(borrador.seleccion.filter(s => s.dia === v.dia).map(s => s.lugarId))
            const n = Number(v.minutosDisponibles)
            const disponibles = /^\d+$/.test(v.minutosDisponibles) && Number.isSafeInteger(n) && n >= 15 && n <= 720 ? n : null
            return <div className="hm-presupuesto hm-tarjeta" key={v.dia} role="status" aria-label={`Resumen del Día ${v.dia}`}>
              <div><span>Día {v.dia} · Tiempo acumulado</span><strong>{duracionPlan(r.totalMinutos)} / {disponibles === null ? 'Sin configurar' : duracionPlan(disponibles)}</strong></div>
              <progress aria-label={`Tiempo utilizado del Día ${v.dia}`} value={Math.min(r.totalMinutos, disponibles ?? 1)} max={disponibles ?? 1} />
              <p>{r.visitasMinutos} min de visitas + {r.trasladosMinutos} min de traslados con regreso + {r.margenMinutos} min de margen reservado.</p>
              <p>{disponibles === null ? 'Configura el tiempo de esta jornada.' : r.totalMinutos > disponibles ? `Excede el tiempo disponible por ${r.totalMinutos - disponibles} minutos.` : `Tiempo libre: ${disponibles - r.totalMinutos} min`}</p>
            </div>
          })}
        </section>
        <ConfiguracionHomun borrador={borrador} onChange={actualizar} />
        <p className="hm-nota">Datos demostrativos sin fecha de validación. Visitas y traslados son supuestos del prototipo. Mototaxi sin disponibilidad ni precio confirmados; no está contratado. {avisoRegresoHomun}</p>
        <div className="hm-filtros" role="group" aria-label="Categorías de lugares">{categoriasHomun.map(c => <button type="button" key={c.id} aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)}><Icono nombre={c.icono} tamano={16} />{c.nombre}<span className="hm-contador">{contador(c.id)}</span></button>)}</div>
        <section className="hm-selector" aria-labelledby="hm-categoria-titulo">
          <div className="hm-seccion-titulo"><h2 id="hm-categoria-titulo">{categoriasHomun.find(c => c.id === categoria)!.nombre}</h2><span>{contador(categoria)} seleccionados</span></div>
          {lugaresHomun.filter(l => l.categoria === categoria).map(l => {
            const elegida = borrador.seleccion.find(s => s.lugarId === l.id)
            return <article key={l.id} className="hm-lugar hm-tarjeta">
              <label className="hm-seleccion"><input type="checkbox" aria-label={l.nombre} checked={!!elegida} onChange={() => seleccionar(l.id)} /><span><strong>{l.nombre}</strong><span className="hm-etiqueta">{l.etiqueta}</span></span></label>
              <p>{l.descripcion}</p><div className="hm-metadatos"><span><Icono nombre="timer" tamano={14} />Visita: {l.visitaMinutos} min</span><span><Icono nombre={l.traslado.icono} tamano={14} />{nombreTrasladoHomun(l)}</span></div>
              {elegida && ventanas.length === 2 && <label>Jornada de {l.nombre}<select value={elegida.dia} onChange={e => actualizar({ seleccion: borrador.seleccion.map(s => s.lugarId === l.id ? { ...s, dia: Number(e.target.value) } : s) })}><option value="1">Día 1</option><option value="2">Día 2</option></select></label>}
            </article>
          })}
        </section>
        <div className="hm-resumen-final"><p role="status">{borrador.seleccion.length} lugares seleccionados</p><p>Los filtros conservan tu selección. Genera después de editar; aún no se ha guardado un plan.</p>
          {errores.length > 0 && <div className="hm-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
          <button type="submit" className="hm-primario">Generar mi itinerario<Icono nombre="arrow_forward" tamano={20} /></button>
          <button type="button" className="hm-restablecer" onClick={restablecer}><Icono nombre="restart_alt" tamano={16} />Restablecer selección</button>
        </div>
      </form>
    </div>
  </article>
}
