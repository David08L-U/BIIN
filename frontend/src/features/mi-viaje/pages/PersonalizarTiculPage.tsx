import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import ConfiguracionTicul from '../components/ConfiguracionTicul'
import ModosTicul from '../components/ModosTicul'
import Icono from '../components/IconoItinerario'
import { avisoTrasladoComidaTicul, categoriasTicul, lugaresTicul, nombreTrasladoTicul } from '../data/lugaresTicul'
import type { CategoriaTicul } from '../data/lugaresTicul'
import { useBorradorTicul } from '../hooks/useBorradorTicul'
import { parametrosBorradorTicul, urlBorradorTicul } from '../plan/borradorTicul'
import { calcularPlanTicul, resumirSeleccionTicul } from '../plan/itinerarioTicul'
import { duracionPlan } from '../plan/itinerarioIzamal'
import '../../../styles/itinerario-ticul.css'

export default function PersonalizarTiculPage() {
  const { borrador, actualizar } = useBorradorTicul('personalizado')
  const navegar = useNavigate()
  const [categoria, setCategoria] = useState<CategoriaTicul>('artesanias')
  const clave = parametrosBorradorTicul(borrador).toString()
  const [intento, setIntento] = useState<{ clave: string; errores: string[] } | null>(null)
  const errores = borrador.generado ? calcularPlanTicul(borrador).errores : intento?.clave === clave ? intento.errores : []
  const resumen = resumirSeleccionTicul(borrador.seleccion)
  const n = Number(borrador.configuracion.minutosDisponibles)
  const disponibles = /^\d+$/.test(borrador.configuracion.minutosDisponibles) && Number.isSafeInteger(n) && n >= 15 && n <= 720 ? n : null
  const contador = (id: CategoriaTicul) => lugaresTicul.filter(l => l.categoria === id && borrador.seleccion.includes(l.id)).length
  function restablecer() { actualizar({ seleccion: [], generado: false }); setIntento(null) }
  function generar(e: FormEvent) {
    e.preventDefault()
    const r = calcularPlanTicul(borrador)
    setIntento({ clave, errores: r.errores })
    if (r.plan) navegar(urlBorradorTicul('itinerario', { ...borrador, generado: true, seleccion: r.plan.seleccion }))
  }
  return <article className="ti-plan ti-personalizar" aria-labelledby="ti-personalizar-titulo">
    <header className="ti-cabecera"><Link className="ti-icono-boton" to={urlBorradorTicul('detalle', borrador)} aria-label="Volver a detalle de ruta"><Icono nombre="arrow_back" tamano={20} /></Link><div className="ti-titulo"><p className="ti-ceja">Ticul · La Perla del Sur</p><h1 id="ti-personalizar-titulo">Personalizar Itinerario</h1></div><button type="button" className="ti-icono-boton" aria-label="Reiniciar selección" onClick={restablecer}><Icono nombre="restart_alt" tamano={20} /></button></header>
    <div className="ti-contenido"><ModosTicul borrador={borrador} />
      <form noValidate onSubmit={generar}>
        <section className="ti-contexto"><h2><Icono nombre="palette" tamano={20} />Elige tus paradas en Ticul</h2><p>Combina alfarería, calzado, sabores y patrimonio. El orden seguirá tu selección.</p>
          <div className="ti-presupuesto ti-tarjeta" role="status" aria-label="Resumen de selección" aria-live="polite"><div><span>Tiempo acumulado</span><strong>{duracionPlan(resumen.totalMinutos)} / {disponibles === null ? 'Sin configurar' : duracionPlan(disponibles)}</strong></div><progress aria-label="Tiempo utilizado" value={Math.min(resumen.totalMinutos, disponibles ?? 1)} max={disponibles ?? 1} /><p>{resumen.visitasMinutos} min de visitas + {resumen.trasladosMinutos} min de traslados con regreso + {resumen.margenMinutos} min de margen reservado.</p><p>{disponibles === null ? 'Configura tu tiempo disponible.' : resumen.totalMinutos > disponibles ? `Excede el tiempo disponible por ${resumen.totalMinutos - disponibles} minutos.` : `Tiempo libre: ${disponibles - resumen.totalMinutos} min`}</p></div>
        </section>
        <ConfiguracionTicul borrador={borrador} onChange={actualizar} />
        <p className="ti-nota">Datos demostrativos, sin fecha de validación. Tiempos estimados; precios, aperturas y acceso sin confirmar. Mototaxi sin disponibilidad confirmada. {avisoTrasladoComidaTicul}</p>
        <div className="ti-filtros" role="group" aria-label="Categorías de lugares">{categoriasTicul.map(c => <button type="button" key={c.id} aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)}><Icono nombre={c.icono} tamano={16} />{c.nombre}<span className="ti-contador">{contador(c.id)}</span></button>)}</div>
        <section className="ti-selector" aria-labelledby="ti-categoria-titulo"><div className="ti-seccion-titulo"><h2 id="ti-categoria-titulo">{categoriasTicul.find(c => c.id === categoria)!.nombre}</h2><span>{contador(categoria)} seleccionados</span></div>
          {lugaresTicul.filter(l => l.categoria === categoria).map(l => <article className="ti-lugar ti-tarjeta" key={l.id}><label className="ti-seleccion"><input type="checkbox" aria-label={l.nombre} checked={borrador.seleccion.includes(l.id)} onChange={() => actualizar({ seleccion: borrador.seleccion.includes(l.id) ? borrador.seleccion.filter(id => id !== l.id) : [...borrador.seleccion, l.id] })} /><span><strong>{l.nombre}</strong><span className="ti-etiqueta">{l.etiqueta}</span></span></label><p>{l.descripcion}</p><div className="ti-metadatos"><span><Icono nombre="timer" tamano={14} />Visita: {l.visitaMinutos} min</span><span><Icono nombre={l.traslado.icono} tamano={14} />{nombreTrasladoTicul(l)}</span></div></article>)}
        </section>
        <div className="ti-resumen-final"><p role="status">{borrador.seleccion.length} lugares seleccionados</p><p>Los filtros conservan tu selección. Genera después de editar.</p>{errores.length > 0 && <div className="ti-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}<button type="submit" className="ti-primario">Generar mi itinerario<Icono nombre="arrow_forward" tamano={20} /></button><button type="button" className="ti-restablecer" onClick={restablecer}><Icono nombre="restart_alt" tamano={16} />Restablecer selección</button></div>
      </form>
    </div>
  </article>
}
