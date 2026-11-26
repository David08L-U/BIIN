import FiltrosPlan from '../components/FiltrosPlan'
import { duracionPlan, leerDuracion } from '../plan/duracion'
import ModosPlan from '../components/ModosPlan'
import CabeceraPlan from '../components/CabeceraPlan'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import ConfiguracionViaje from '../components/ConfiguracionViaje'
import Icono from '../components/IconoItinerario'
import { categoriasIzamal, lugaresIzamal } from '../data/lugaresIzamal'
import type { CategoriaIzamal } from '../data/lugaresIzamal'
import { useBorradorIzamal } from '../hooks/useBorradorIzamal'
import { urlBorrador } from '../plan/borradorIzamal'
import { calcularPlan, resumirSeleccion } from '../plan/itinerarioIzamal'
import LugaresSeleccionados from '../components/LugaresSeleccionados'

export default function PersonalizarIzamalPage() {
  const { borrador, actualizar } = useBorradorIzamal('personalizado')
  const navegar = useNavigate()
  const [categoria, setCategoria] = useState<CategoriaIzamal>('gastronomia')
  const [errores, setErrores] = useState<string[]>([])
  const resumen = resumirSeleccion(borrador.seleccion)
  const disponibles = leerDuracion(borrador.configuracion.minutosDisponibles)
  const restante = disponibles === null ? null : disponibles - resumen.totalMinutos
  const categoriaActual = categoriasIzamal.find(opcion => opcion.id === categoria)!
  const contador = (id: CategoriaIzamal) => lugaresIzamal.filter(lugar => lugar.categoria === id && borrador.seleccion.includes(lugar.id)).length

  function seleccionar(id: string) {
    actualizar({ seleccion: borrador.seleccion.includes(id) ? borrador.seleccion.filter(elegido => elegido !== id) : [...borrador.seleccion, id] })
    setErrores([])
  }
  function restablecer() {
    actualizar({ seleccion: [], generado: false })
    setErrores([])
  }
  function generar(evento: FormEvent) {
    evento.preventDefault()
    const resultado = calcularPlan(borrador)
    setErrores(resultado.errores)
    if (resultado.plan) navegar(urlBorrador('itinerario', { ...borrador, generado: true }))
  }

  return (
    <article className="iz-plan iz-personalizar" aria-labelledby="iz-personalizar-titulo">
      <CabeceraPlan id="iz-personalizar-titulo" titulo="Personalizar Itinerario" subtitulo="Izamal · Pueblo Mágico" volver={urlBorrador('detalle', borrador)} personalizar acciones={<>
          <button type="button" className="iz-plan-icono-boton" aria-label="Reiniciar selección" onClick={restablecer}><Icono nombre="restart_alt" tamano={22} /></button>
          <span className="iz-plan-avatar" aria-hidden="true"><Icono nombre="person" tamano={18} /></span>
        </>} />
      <ModosPlan
        modo={borrador.modo}
        recomendado={urlBorrador('itinerario', { ...borrador, modo: 'recomendado', generado: false })}
        personalizado={urlBorrador('personalizar', { ...borrador, modo: 'personalizado', generado: false })}
      />
      <form id="iz-personalizar-form" noValidate onSubmit={generar}>
        <section className="iz-plan-contexto">
          <div className="iz-plan-transito"><Icono nombre="directions_bus" /><strong>Van BIIN · Ruta Mérida-Izamal</strong><span>Sin confirmar</span></div>
          <p>Elige tus paradas por categoría para armar tu ruta a pie personalizada dentro de tu margen de estancia en Izamal.</p>
          <div className="iz-plan-presupuesto" role="status" aria-live="polite">
            <div><span><Icono nombre="schedule" />Tiempo acumulado</span><strong>{duracionPlan(resumen.totalMinutos)} / {disponibles === null ? 'Sin configurar' : duracionPlan(disponibles)}</strong></div>
            <progress aria-label="Tiempo utilizado" value={Math.min(resumen.totalMinutos, disponibles ?? 1)} max={disponibles || 1} />
            <p>{duracionPlan(resumen.visitasMinutos)} de visitas + {duracionPlan(resumen.trasladosMinutos)} de desplazamientos estimados + 15 min de margen final.</p>
            <p>{restante === null ? 'Configura tu tiempo disponible.' : restante >= 0 ? `Tiempo libre: ${duracionPlan(restante)}` : `Excede el tiempo disponible por ${duracionPlan(Math.abs(restante))}.`}</p>
          </div>
        </section>
        <ConfiguracionViaje configuracion={borrador.configuracion} onChange={configuracion => { actualizar({ configuracion }); setErrores([]) }} />
        <p className="iz-plan-nota">Lugares, descripciones y duraciones del prototipo: demostrativos, sin fecha de validación. Precios, aperturas y traslados sin verificar.</p>
        <FiltrosPlan etiqueta="Categorías de lugares" opciones={categoriasIzamal} activo={categoria} seleccionar={setCategoria} contador={contador} />
        <section className="iz-plan-selector" aria-labelledby="iz-plan-categoria">
          <div className="iz-plan-categoria-titulo"><h2 id="iz-plan-categoria"><Icono nombre={categoriaActual.icono} />{categoriaActual.titulo}</h2><span>{contador(categoria)} seleccionados</span></div>
          <p className="iz-plan-categoria-descripcion">{categoriaActual.descripcion}</p>
          <div className="iz-plan-lista-lugares">
            {lugaresIzamal.filter(lugar => lugar.categoria === categoria).map(lugar => (
              <article key={lugar.id} className="iz-plan-lugar iz-plan-tarjeta">
                <label className="iz-plan-lugar-seleccion">
                  <input type="checkbox" aria-label={lugar.nombre} checked={borrador.seleccion.includes(lugar.id)} onChange={() => seleccionar(lugar.id)} />
                  <span className="iz-plan-lugar-textos"><span className="iz-plan-lugar-titulo">{lugar.nombre}</span><span className="iz-plan-insignia">{lugar.etiqueta}</span></span>
                </label>
                <div className="iz-plan-lugar-detalle"><p>{lugar.descripcion}</p><div className="iz-plan-metadatos"><span><Icono nombre="timer" tamano={14} />{duracionPlan(lugar.visitaMinutos)}</span><span><Icono nombre="directions_walk" tamano={14} />{duracionPlan(lugar.trasladoMinutos)} estimados</span><span>Demostración</span></div></div>
              </article>
            ))}
          </div>
        </section>
        <LugaresSeleccionados lugares={borrador.seleccion.map(id => ({ id, nombre: lugaresIzamal.find(l => l.id === id)?.nombre ?? id }))} onQuitar={id => { actualizar({ seleccion: borrador.seleccion.filter(elegido => elegido !== id) }); setErrores([]) }} />
        <div className="iz-plan-resumen-final">
          <p role="status">{borrador.seleccion.length} lugares seleccionados</p>
          <p>El orden seguirá tu selección, sin optimización geográfica.</p>
          {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
          <button type="submit" className="iz-plan-primario">Generar mi itinerario<Icono nombre="arrow_forward" tamano={20} /></button>
          <button type="button" className="iz-plan-restablecer" onClick={restablecer}><Icono nombre="restart_alt" tamano={14} />Restablecer selección</button>
        </div>
      </form>
    </article>
  )
}
