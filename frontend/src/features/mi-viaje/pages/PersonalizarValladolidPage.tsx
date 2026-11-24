import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import ConfiguracionValladolid from '../components/ConfiguracionValladolid'
import Icono from '../components/IconoItinerario'
import { categoriasValladolid, lugaresValladolid } from '../data/lugaresValladolid'
import type { CategoriaValladolid } from '../data/lugaresValladolid'
import { useBorradorValladolid } from '../hooks/useBorradorValladolid'
import { urlBorradorValladolid } from '../plan/borradorValladolid'
import { calcularPlanValladolid, resumirJornadaValladolid, ventanasValladolid } from '../plan/itinerarioValladolid'
import { duracionPlan } from '../plan/itinerarioIzamal'
import '../../../styles/itinerario-izamal.css'
import '../../../styles/itinerario-valladolid.css'

/** Reutiliza la estructura aprobada del selector, sin cambiar la pantalla de Izamal. */
export default function PersonalizarValladolidPage() {
  const { borrador, actualizar } = useBorradorValladolid('personalizado')
  const navegar = useNavigate()
  const [categoria, setCategoria] = useState<CategoriaValladolid>('gastronomia')
  const [errores, setErrores] = useState<string[]>([])
  const categoriaActual = categoriasValladolid.find(c => c.id === categoria)!
  const contador = (id: CategoriaValladolid) => lugaresValladolid.filter(l => l.categoria === id && borrador.seleccion.some(s => s.lugarId === l.id)).length
  const ventanas = ventanasValladolid(borrador.configuracion)
  function seleccionar(lugarId: string) {
    actualizar({ seleccion: borrador.seleccion.some(s => s.lugarId === lugarId) ? borrador.seleccion.filter(s => s.lugarId !== lugarId) : [...borrador.seleccion, { lugarId, dia: 1 }] })
    setErrores([])
  }
  function restablecer() { actualizar({ seleccion: [], generado: false, modo: 'personalizado' }); setErrores([]) }
  function generar(evento: FormEvent) {
    evento.preventDefault()
    const resultado = calcularPlanValladolid(borrador)
    setErrores(resultado.errores)
    if (resultado.plan) navegar(urlBorradorValladolid('itinerario', { ...borrador, generado: true }))
  }
  return <article className="iz-plan iz-personalizar va-personalizar" aria-labelledby="va-personalizar-titulo">
    <header className="iz-plan-cabecera iz-personalizar-cabecera">
      <Link className="iz-plan-icono-boton" to={urlBorradorValladolid('detalle', borrador)} aria-label="Volver a detalle de ruta"><Icono nombre="arrow_back" tamano={24} /></Link>
      <div><h1 id="va-personalizar-titulo">Personalizar Itinerario</h1><p className="iz-plan-ceja">Valladolid · La Sultana del Oriente</p></div>
      <div className="iz-personalizar-utilidades"><button type="button" className="iz-plan-icono-boton" aria-label="Reiniciar selección" onClick={restablecer}><Icono nombre="restart_alt" tamano={22} /></button><span className="iz-plan-avatar" aria-hidden="true"><Icono nombre="person" tamano={18} /></span></div>
    </header>
    <div className="va-modos" role="group" aria-label="Modo de planificación"><Link to={urlBorradorValladolid('itinerario', { ...borrador, modo: 'recomendado', generado: false })}>Recomendado</Link><Link aria-current="page" to={urlBorradorValladolid('personalizar', { ...borrador, modo: 'personalizado', generado: false })}>Personalizado</Link></div>
    <form noValidate onSubmit={generar}>
      <section className="iz-plan-contexto">
        <div className="iz-plan-transito"><Icono nombre="directions_bus" /><strong>BIIN · Ruta Mérida-Valladolid</strong><span>Sin confirmar</span></div>
        <p>Elige tus lugares por categoría. Para fin de semana, asigna cada visita a una jornada.</p>
        {ventanas.map(v => {
          const resumen = resumirJornadaValladolid(borrador.seleccion.filter(s => s.dia === v.dia).map(s => s.lugarId))
          const disponibles = /^\d+$/.test(v.minutosDisponibles) && Number(v.minutosDisponibles) >= 15 && Number(v.minutosDisponibles) <= 720 ? Number(v.minutosDisponibles) : 0
          const restante = disponibles - resumen.totalMinutos
          return <div className="iz-plan-presupuesto va-presupuesto" role="status" aria-label={`Resumen del Día ${v.dia}`} key={v.dia}>
            <div><span><Icono nombre="schedule" />Día {v.dia} · Tiempo acumulado</span><strong>{duracionPlan(resumen.totalMinutos)} / {disponibles ? duracionPlan(disponibles) : 'Sin configurar'}</strong></div>
            <progress aria-label={`Tiempo utilizado del Día ${v.dia}`} value={Math.min(resumen.totalMinutos, disponibles || 1)} max={disponibles || 1} />
            <p>{resumen.visitasMinutos} min de visitas + {resumen.trasladosMinutos} min de desplazamientos (incluye traslado final) + 15 min de margen final.</p>
            <p>{!disponibles ? 'Configura el tiempo de esta jornada.' : restante >= 0 ? `Tiempo libre: ${restante} min` : `Excede el tiempo disponible por ${Math.abs(restante)} minutos.`}</p>
          </div>
        })}
      </section>
      <ConfiguracionValladolid borrador={borrador} onChange={nuevo => { actualizar(nuevo); setErrores([]) }} />
      <p className="iz-plan-nota">Lugares, descripciones, imágenes, visitas y caminatas del prototipo: demostrativos, sin fecha de validación. Aperturas, tarifas y transporte sin confirmar.</p>
      <div className="iz-plan-filtros" role="group" aria-label="Categorías de lugares">
        {categoriasValladolid.map(c => <button type="button" key={c.id} aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)}><Icono nombre={c.icono} tamano={16} /><span>{c.nombre}</span><span className="iz-plan-contador">{contador(c.id)}</span></button>)}
      </div>
      <section className="iz-plan-selector" aria-labelledby="va-categoria-titulo">
        <div className="iz-plan-categoria-titulo"><h2 id="va-categoria-titulo"><Icono nombre={categoriaActual.icono} />{categoriaActual.titulo}</h2><span>{contador(categoria)} seleccionados</span></div>
        <p className="iz-plan-categoria-descripcion">{categoriaActual.descripcion}</p>
        <div className="iz-plan-lista-lugares">{lugaresValladolid.filter(l => l.categoria === categoria).map(lugar => {
          const elegida = borrador.seleccion.find(s => s.lugarId === lugar.id)
          return <article key={lugar.id} className="iz-plan-lugar iz-plan-tarjeta">
            <label className="iz-plan-lugar-seleccion"><input type="checkbox" aria-label={lugar.nombre} checked={!!elegida} onChange={() => seleccionar(lugar.id)} /><span className="iz-plan-lugar-textos"><span className="iz-plan-lugar-titulo">{lugar.nombre}</span><span className="iz-plan-insignia">{lugar.etiqueta}</span></span></label>
            <div className="iz-plan-lugar-detalle"><p>{lugar.descripcion}</p><div className="iz-plan-metadatos"><span><Icono nombre="timer" tamano={14} />{duracionPlan(lugar.visitaMinutos)}</span><span><Icono nombre="directions_walk" tamano={14} />{lugar.trasladoMinutos} min estimados</span><span>Demostración</span></div>
              {elegida && ventanas.length === 2 && <label className="va-asignacion">Jornada de {lugar.nombre}<select value={elegida.dia} onChange={e => { actualizar({ seleccion: borrador.seleccion.map(s => s.lugarId === lugar.id ? { ...s, dia: Number(e.target.value) } : s) }); setErrores([]) }}><option value="1">Día 1</option><option value="2">Día 2</option></select></label>}
            </div>
          </article>
        })}</div>
      </section>
      <div className="iz-plan-resumen-final">
        <p role="status">{borrador.seleccion.length} lugares seleccionados</p><p>El orden sigue tu selección dentro de cada día, sin optimización geográfica. Aún no hay un plan vigente; genera después de elegir.</p>
        {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
        <button type="submit" className="iz-plan-primario">Generar mi itinerario<Icono nombre="arrow_forward" tamano={20} /></button>
        <button type="button" className="iz-plan-restablecer" onClick={restablecer}><Icono nombre="restart_alt" tamano={14} />Restablecer selección</button>
      </div>
    </form>
  </article>
}
