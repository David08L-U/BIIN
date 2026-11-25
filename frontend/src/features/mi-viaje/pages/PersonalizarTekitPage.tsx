import CabeceraPlan from '../components/CabeceraPlan'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import ConfiguracionTekit from '../components/ConfiguracionTekit'
import ModosTekit from '../components/ModosTekit'
import Icono from '../components/IconoItinerario'
import { categoriasTekit, lugaresTekit } from '../data/lugaresTekit'
import type { CategoriaTekit } from '../data/lugaresTekit'
import { useBorradorTekit } from '../hooks/useBorradorTekit'
import { parametrosBorradorTekit, urlBorradorTekit } from '../plan/borradorTekit'
import { calcularPlanTekit, resumirSeleccionTekit } from '../plan/itinerarioTekit'
import { duracionPlan } from '../plan/duracion'

export default function PersonalizarTekitPage() {
  const { borrador, actualizar } = useBorradorTekit('personalizado')
  const navegar = useNavigate()
  const [categoria, setCategoria] = useState<CategoriaTekit>('textil')
  const clave = parametrosBorradorTekit(borrador).toString()
  const [intento, setIntento] = useState<{ clave: string; errores: string[] } | null>(null)
  const resumen = resumirSeleccionTekit(borrador.seleccion)
  const n = Number(borrador.configuracion.minutosDisponibles)
  const disponibles = /^\d+$/.test(borrador.configuracion.minutosDisponibles) && Number.isSafeInteger(n) && n >= 15 && n <= 720 ? n : null
  const contador = (id: CategoriaTekit) => lugaresTekit.filter(l => l.categoria === id && borrador.seleccion.includes(l.id)).length
  const errores = borrador.generado ? calcularPlanTekit(borrador).errores : intento?.clave === clave ? intento.errores : []
  function restablecer() { actualizar({ seleccion: [], generado: false }); setIntento(null) }
  function generar(e: FormEvent) {
    e.preventDefault()
    const resultado = calcularPlanTekit(borrador)
    setIntento({ clave, errores: resultado.errores })
    if (resultado.plan) navegar(urlBorradorTekit('itinerario', { ...borrador, generado: true, seleccion: resultado.plan.seleccion }))
  }
  return <article className="iz-plan iz-personalizar" aria-labelledby="tk-personalizar-titulo">
    <CabeceraPlan id="tk-personalizar-titulo" titulo="Personalizar Itinerario" subtitulo="Tekit · Tradición textil" volver={urlBorradorTekit('detalle', borrador)} personalizar acciones={<>
          <button type="button" className="iz-plan-icono-boton" aria-label="Reiniciar selección" onClick={restablecer}><Icono nombre="restart_alt" tamano={20} /></button>

        </>} />
    <div className="iz-plan-contenido">
      <ModosTekit borrador={borrador} personalizado />
      <form noValidate onSubmit={generar}>
        <section className="iz-plan-contexto">
          <h2><Icono nombre="styler" tamano={20} />Teje tu recorrido por Tekit</h2>
          <p>Elige tus paradas por categoría. El orden seguirá tu selección; confirma las condiciones de visita con cada lugar.</p>
          <div className="iz-plan-presupuesto iz-plan-tarjeta" role="status" aria-label="Resumen de selección" aria-live="polite">
            <div><span>Tiempo acumulado</span><strong>{duracionPlan(resumen.totalMinutos)} / {disponibles === null ? 'Sin configurar' : duracionPlan(disponibles)}</strong></div>
            <progress aria-label="Tiempo utilizado" value={Math.min(resumen.totalMinutos, disponibles ?? 1)} max={disponibles ?? 1} />
            <p>{duracionPlan(resumen.visitasMinutos)} de visitas + {duracionPlan(resumen.trasladosMinutos)} de desplazamientos con regreso + {duracionPlan(resumen.margenMinutos)} de margen reservado.</p>
            {disponibles !== null && <p>{resumen.totalMinutos > disponibles ? `Excede el tiempo disponible por ${duracionPlan(resumen.totalMinutos - disponibles)}.` : `Tiempo libre: ${duracionPlan(disponibles - resumen.totalMinutos)}`}</p>}
          </div>
        </section>
        <ConfiguracionTekit borrador={borrador} onChange={actualizar} />
        <p className="iz-plan-nota">Datos demostrativos, sin fecha de validación. Visitas y desplazamientos son supuestos del prototipo; no son mediciones geográficas. Aperturas, precios y visitas guiadas sin confirmar.</p>
        <div className="iz-plan-filtros" role="group" aria-label="Categorías de lugares">
          {categoriasTekit.map(c => <button type="button" key={c.id} aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)}><Icono nombre={c.icono} tamano={16} />{c.nombre}<span className="iz-plan-contador">{contador(c.id)}</span></button>)}
        </div>
        <section aria-labelledby="tk-categoria-titulo" className="iz-plan-selector">
          <div className="iz-plan-categoria-titulo"><h2 id="tk-categoria-titulo">{categoriasTekit.find(c => c.id === categoria)!.nombre}</h2><span>{contador(categoria)} seleccionados</span></div>
          {lugaresTekit.filter(l => l.categoria === categoria).map(lugar => <article className="iz-plan-lugar iz-plan-tarjeta" key={lugar.id}>
            <label className="iz-plan-lugar-seleccion"><input type="checkbox" aria-label={lugar.nombre} checked={borrador.seleccion.includes(lugar.id)} onChange={() => actualizar({ seleccion: borrador.seleccion.includes(lugar.id) ? borrador.seleccion.filter(id => id !== lugar.id) : [...borrador.seleccion, lugar.id] })} /><span className="iz-plan-lugar-textos"><strong className="iz-plan-lugar-titulo">{lugar.nombre}</strong><span className="iz-plan-insignia"><Icono nombre={lugar.icono} tamano={13} />{lugar.etiqueta}</span></span></label>
            <p>{lugar.descripcion}</p><p className="iz-plan-nota">Visita: {duracionPlan(lugar.visitaMinutos)} · Traslado previo: {duracionPlan(lugar.trasladoMinutos)} estimados</p>
          </article>)}
        </section>
        <div className="iz-plan-resumen-final">
          <p role="status">{borrador.seleccion.length} lugares seleccionados</p>
          {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
          <button type="submit" className="iz-plan-primario">Generar mi itinerario<Icono nombre="arrow_forward" tamano={20} /></button>
          <button type="button" className="iz-plan-restablecer" onClick={restablecer}><Icono nombre="restart_alt" tamano={16} />Restablecer selección</button>
        </div>
      </form>
    </div>
  </article>
}
