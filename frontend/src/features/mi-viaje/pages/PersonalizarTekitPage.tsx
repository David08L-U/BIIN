import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import ConfiguracionTekit from '../components/ConfiguracionTekit'
import ModosTekit from '../components/ModosTekit'
import Icono from '../components/IconoItinerario'
import { categoriasTekit, lugaresTekit } from '../data/lugaresTekit'
import type { CategoriaTekit } from '../data/lugaresTekit'
import { useBorradorTekit } from '../hooks/useBorradorTekit'
import { parametrosBorradorTekit, urlBorradorTekit } from '../plan/borradorTekit'
import { calcularPlanTekit, resumirSeleccionTekit } from '../plan/itinerarioTekit'
import { duracionPlan } from '../plan/itinerarioIzamal'
import '../../../styles/itinerario-tekit.css'

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
  return <article className="tk-plan tk-personalizar" aria-labelledby="tk-personalizar-titulo">
    <header className="tk-cabecera">
      <Link className="tk-icono-boton" to={urlBorradorTekit('detalle', borrador)} aria-label="Volver a detalle de ruta"><Icono nombre="arrow_back" tamano={20} /></Link>
      <div className="tk-titulo"><p className="tk-ceja">Tekit · Tradición textil</p><h1 id="tk-personalizar-titulo">Personalizar Itinerario</h1></div>
      <button type="button" className="tk-icono-boton" aria-label="Reiniciar selección" onClick={restablecer}><Icono nombre="restart_alt" tamano={20} /></button>
    </header>
    <div className="tk-contenido">
      <ModosTekit borrador={borrador} personalizado />
      <form noValidate onSubmit={generar}>
        <section className="tk-contexto">
          <h2><Icono nombre="styler" tamano={20} />Teje tu recorrido por Tekit</h2>
          <p>Elige tus paradas por categoría. El orden seguirá tu selección; confirma las condiciones de visita con cada lugar.</p>
          <div className="tk-presupuesto tk-tarjeta" role="status" aria-label="Resumen de selección" aria-live="polite">
            <div><span>Tiempo acumulado</span><strong>{duracionPlan(resumen.totalMinutos)} / {disponibles === null ? 'Sin configurar' : duracionPlan(disponibles)}</strong></div>
            <progress aria-label="Tiempo utilizado" value={Math.min(resumen.totalMinutos, disponibles ?? 1)} max={disponibles ?? 1} />
            <p>{resumen.visitasMinutos} min de visitas + {resumen.trasladosMinutos} min de desplazamientos con regreso + {resumen.margenMinutos} min de margen reservado.</p>
            {disponibles !== null && <p>{resumen.totalMinutos > disponibles ? `Excede el tiempo disponible por ${resumen.totalMinutos - disponibles} minutos.` : `Tiempo libre: ${disponibles - resumen.totalMinutos} min`}</p>}
          </div>
        </section>
        <ConfiguracionTekit borrador={borrador} onChange={actualizar} />
        <p className="tk-nota">Datos demostrativos, sin fecha de validación. Visitas y desplazamientos son supuestos del prototipo; no son mediciones geográficas. Aperturas, precios y visitas guiadas sin confirmar.</p>
        <div className="tk-filtros" role="group" aria-label="Categorías de lugares">
          {categoriasTekit.map(c => <button type="button" key={c.id} aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)}><Icono nombre={c.icono} tamano={16} />{c.nombre}<span className="tk-contador">{contador(c.id)}</span></button>)}
        </div>
        <section aria-labelledby="tk-categoria-titulo" className="tk-selector">
          <div className="tk-seccion-titulo"><h2 id="tk-categoria-titulo">{categoriasTekit.find(c => c.id === categoria)!.nombre}</h2><span>{contador(categoria)} seleccionados</span></div>
          {lugaresTekit.filter(l => l.categoria === categoria).map(lugar => <article className="tk-lugar tk-tarjeta" key={lugar.id}>
            <label><input type="checkbox" aria-label={lugar.nombre} checked={borrador.seleccion.includes(lugar.id)} onChange={() => actualizar({ seleccion: borrador.seleccion.includes(lugar.id) ? borrador.seleccion.filter(id => id !== lugar.id) : [...borrador.seleccion, lugar.id] })} /><span><strong>{lugar.nombre}</strong><span className="tk-etiqueta"><Icono nombre={lugar.icono} tamano={13} />{lugar.etiqueta}</span></span></label>
            <p>{lugar.descripcion}</p><p className="tk-nota">Visita: {lugar.visitaMinutos} min · Traslado previo: {lugar.trasladoMinutos} min estimados</p>
          </article>)}
        </section>
        <div className="tk-resumen-final">
          <p role="status">{borrador.seleccion.length} lugares seleccionados</p>
          {errores.length > 0 && <div className="tk-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
          <button type="submit" className="tk-primario">Generar mi itinerario<Icono nombre="arrow_forward" tamano={20} /></button>
          <button type="button" className="tk-restablecer" onClick={restablecer}><Icono nombre="restart_alt" tamano={16} />Restablecer selección</button>
        </div>
      </form>
    </div>
  </article>
}
