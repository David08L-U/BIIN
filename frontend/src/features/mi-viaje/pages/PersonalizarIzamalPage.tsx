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
import { TRASLADO_FINAL_MINUTOS, MARGEN_FINAL_MINUTOS } from '../data/lugaresIzamal'
import { resumirRecorrido } from '../plan/recorridoSecuencial'
import LugaresSeleccionados from '../components/LugaresSeleccionados'
import CancelarEdicion from '../components/CancelarEdicion'

export default function PersonalizarIzamalPage() {
  const { borrador, actualizar } = useBorradorIzamal('personalizado')
  const navegar = useNavigate()
  const [categoria, setCategoria] = useState<CategoriaIzamal>('gastronomia')
  const [errores, setErrores] = useState<string[]>([])
  const resumen = resumirSeleccion(borrador.seleccion)
  const finDeSemana = borrador.configuracion.estancia === 'fin-de-semana'
  const disponibles = leerDuracion(borrador.configuracion.minutosDisponibles)
  const restante = disponibles === null ? null : disponibles - resumen.totalMinutos
  const categoriaActual = categoriasIzamal.find(opcion => opcion.id === categoria)!
  const contador = (id: CategoriaIzamal) => lugaresIzamal.filter(lugar => lugar.categoria === id && borrador.seleccion.includes(lugar.id)).length

  function seleccionar(id: string) {
    const esta = borrador.seleccion.includes(id)
    actualizar({ seleccion: esta ? borrador.seleccion.filter(elegido => elegido !== id) : [...borrador.seleccion, id], seleccionDia2: esta ? borrador.seleccionDia2?.filter(elegido => elegido !== id) : borrador.seleccionDia2 })
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
    if (resultado.plan) navegar(urlBorrador('itinerario', { ...borrador, seleccionDia2: resultado.plan.jornadas?.[1]?.seleccion, generado: true }))
  }

  return (
    <article className="iz-plan iz-personalizar" aria-labelledby="iz-personalizar-titulo">
      <CabeceraPlan id="iz-personalizar-titulo" titulo="Personalizar Itinerario" subtitulo="Izamal · Pueblo Mágico" volver={urlBorrador('detalle', borrador)} personalizar acciones={<>
          <button type="button" className="iz-plan-icono-boton" aria-label="Reiniciar selección" onClick={restablecer}><Icono nombre="restart_alt" tamano={22} /></button>
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
          {finDeSemana ? [1, 2].map(dia => {
            const ids = borrador.seleccion.filter(id => borrador.seleccionDia2?.includes(id) === (dia === 2))
            const r = resumirRecorrido(lugaresIzamal, ids, dia === 2 ? TRASLADO_FINAL_MINUTOS : 0, MARGEN_FINAL_MINUTOS)
            const disponible = leerDuracion(dia === 1 ? borrador.configuracion.minutosDisponibles : borrador.configuracion.minutosDia2 ?? '')
            return <div className="iz-plan-presupuesto" role="status" aria-label={`Resumen del Día ${dia}`} key={dia}><div><span><Icono nombre="schedule" />Día {dia} · Tiempo acumulado</span><strong>{duracionPlan(r.totalMinutos)} / {disponible === null ? 'Sin configurar' : duracionPlan(disponible)}</strong></div><progress aria-label={`Tiempo utilizado del Día ${dia}`} value={Math.min(r.totalMinutos, disponible ?? 1)} max={disponible ?? 1} /><p>{duracionPlan(r.visitasMinutos)} de visitas + {duracionPlan(r.trasladosMinutos)} de traslados locales{dia === 2 ? ' y traslado final' : ''} + {duracionPlan(r.margenMinutos)} de margen.</p><p>{disponible === null ? 'Configura el tiempo de esta jornada.' : r.totalMinutos > disponible ? `Excede el tiempo disponible por ${duracionPlan(r.totalMinutos - disponible)}.` : `Tiempo libre: ${duracionPlan(disponible - r.totalMinutos)}`}</p></div>
          }) : <div className="iz-plan-presupuesto" role="status" aria-live="polite">
            <div><span><Icono nombre="schedule" />Tiempo acumulado</span><strong>{duracionPlan(resumen.totalMinutos)} / {disponibles === null ? 'Sin configurar' : duracionPlan(disponibles)}</strong></div>
            <progress aria-label="Tiempo utilizado" value={Math.min(resumen.totalMinutos, disponibles ?? 1)} max={disponibles || 1} />
            <p>{duracionPlan(resumen.visitasMinutos)} de visitas + {duracionPlan(resumen.trasladosMinutos)} de desplazamientos estimados + 15 min de margen final.</p>
            <p>{restante === null ? 'Configura tu tiempo disponible.' : restante >= 0 ? `Tiempo libre: ${duracionPlan(restante)}` : `Excede el tiempo disponible por ${duracionPlan(Math.abs(restante))}.`}</p>
          </div>}
        </section>
        <ConfiguracionViaje configuracion={borrador.configuracion} onChange={configuracion => { actualizar({ configuracion, ...((configuracion.estancia !== 'fin-de-semana') ? { seleccionDia2: [] } : {}) }); setErrores([]) }} />
        <p className="iz-plan-nota">Información demostrativa, pendiente de validar. Precios, aperturas y traslados por confirmar.</p>
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
        <LugaresSeleccionados jornadas={finDeSemana ? 2 : 1} lugares={borrador.seleccion.map(id => ({ id, nombre: lugaresIzamal.find(l => l.id === id)?.nombre ?? id, dia: borrador.seleccionDia2?.includes(id) ? 2 : 1 }))} onCambiarDia={(id, dia) => actualizar({ seleccionDia2: dia === 2 ? [...new Set([...(borrador.seleccionDia2 ?? []), id])] : (borrador.seleccionDia2 ?? []).filter(elegido => elegido !== id) })} onQuitar={id => { actualizar({ seleccion: borrador.seleccion.filter(elegido => elegido !== id), seleccionDia2: (borrador.seleccionDia2 ?? []).filter(elegido => elegido !== id) }); setErrores([]) }} />
        <div className="iz-plan-resumen-final">
          <p role="status">{borrador.seleccion.length} lugares seleccionados</p>
          <p>El orden seguirá tu selección, sin optimización geográfica.</p>
          {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
          <CancelarEdicion editarId={borrador.editarId} /><button type="submit" className="iz-plan-primario">Generar mi itinerario<Icono nombre="arrow_forward" tamano={20} /></button>
          <button type="button" className="iz-plan-restablecer" onClick={restablecer}><Icono nombre="restart_alt" tamano={14} />Restablecer selección</button>
        </div>
      </form>
    </article>
  )
}
