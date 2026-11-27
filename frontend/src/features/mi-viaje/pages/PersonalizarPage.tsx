import { useState } from 'react'
import { useParams } from 'react-router'
import type { DestinoId } from '../../destinos/contratos'
import { obtenerDestino } from '../../destinos/registroDestinos'
import RutaNoEncontrada from '../../transporte/components/RutaNoEncontrada'
import { usePlanificador } from '../hooks/usePlanificador'
import { duracionPlan, leerDuracion } from '../plan/duracion'
import { planificadores } from '../plan/registroPlanificadores'
import CabeceraPlan from '../components/CabeceraPlan'
import CancelarEdicion from '../components/CancelarEdicion'
import FiltrosPlan from '../components/FiltrosPlan'
import Icono from '../components/IconoItinerario'
import LugaresSeleccionados from '../components/LugaresSeleccionados'
import ModosPlan from '../components/ModosPlan'

export default function PersonalizarPage() {
  const destino = obtenerDestino(useParams().id)
  return destino ? <Personalizar key={destino.id} destino={destino.id} /> : <RutaNoEncontrada />
}

function Personalizar({ destino }: { destino: DestinoId }) {
  const adaptador = planificadores[destino]
  const { datos } = adaptador
  const sesion = usePlanificador(adaptador, 'personalizar')
  const { seleccion, ventanas, errores, actualizar, cambiarSeleccion } = sesion
  const [categoria, setCategoria] = useState(datos.categoriaInicial)
  const categoriaActual = datos.categorias.find(opcion => opcion.id === categoria)
  const numerarJornadas = ventanas.length > 1 || datos.mostrarDia
  const contador = (id: string) => datos.lugares.filter(lugar => lugar.categoria === id && seleccion.some(visita => visita.lugarId === lugar.id)).length
  const quitar = (id: string) => actualizar(cambiarSeleccion(seleccion.filter(visita => visita.lugarId !== id)))
  const restablecer = () => actualizar(cambiarSeleccion([]))
  const lugaresElegidos = seleccion.map(({ lugarId, dia }) => ({
    id: lugarId, dia, nombre: datos.lugares.find(lugar => lugar.id === lugarId)?.nombre ?? lugarId,
  }))

  return <article className="iz-plan iz-personalizar" aria-labelledby="personalizar-titulo">
    <CabeceraPlan id="personalizar-titulo" titulo="Personalizar Itinerario" subtitulo={datos.subtitulo} volver={sesion.urlDetalle} personalizar acciones={
      <button type="button" className="iz-plan-icono-boton" aria-label="Reiniciar selección" onClick={restablecer}><Icono nombre="restart_alt" tamano={20} /></button>
    } />
    <div className="iz-plan-contenido">
      <ModosPlan modo={sesion.borrador.modo} recomendado={sesion.recomendado} personalizado={sesion.personalizar} />
      <form noValidate onSubmit={sesion.generar}>
        <section className="iz-plan-contexto">
          <h2><Icono nombre={datos.icono} tamano={20} />{datos.contexto}</h2>
          <p>Elige tus paradas por categoría. El recorrido conserva el orden de tu selección dentro de cada jornada.</p>
          {ventanas.map((ventana, indice) => {
            const incluirRegreso = indice === ventanas.length - 1
            const resumen = sesion.resumen(seleccion.filter(visita => visita.dia === ventana.dia).map(visita => visita.lugarId), incluirRegreso)
            const disponibles = leerDuracion(ventana.minutosDisponibles)
            const restante = disponibles === null ? null : disponibles - resumen.totalMinutos
            const etiqueta = numerarJornadas ? ` · Día ${ventana.dia}` : ''
            const traslados = ventanas.length === 1 ? datos.etiquetaTraslados : incluirRegreso ? 'traslados locales y traslado final' : 'traslados locales'
            return <div key={ventana.dia} className="iz-plan-presupuesto iz-plan-tarjeta" role="status" aria-label={numerarJornadas ? `Resumen del Día ${ventana.dia}` : 'Resumen de selección'} aria-live="polite">
              <div><span>Tiempo acumulado{etiqueta}</span><strong>{duracionPlan(resumen.totalMinutos)} / {disponibles === null ? 'Sin configurar' : duracionPlan(disponibles)}</strong></div>
              <progress aria-label={`Tiempo utilizado${etiqueta}`} value={Math.min(resumen.totalMinutos, disponibles || 1)} max={disponibles || 1} />
              <p>{duracionPlan(resumen.visitasMinutos)} de visitas + {duracionPlan(resumen.trasladosMinutos)} de {traslados} + {duracionPlan(resumen.margenMinutos)} de margen reservado.</p>
              {restante !== null && <p>{restante < 0 ? `Excede el tiempo disponible por ${duracionPlan(-restante)}.` : `Tiempo libre: ${duracionPlan(restante)}`}</p>}
            </div>
          })}
        </section>
        {sesion.configuracion(actualizar)}
        <p className="iz-plan-nota">{datos.nota}</p>
        <FiltrosPlan etiqueta="Categorías de lugares" opciones={datos.categorias} activo={categoria} seleccionar={setCategoria} contador={contador} />
        <section className="iz-plan-selector" aria-labelledby="categoria-titulo">
          <div className="iz-plan-categoria-titulo"><h2 id="categoria-titulo">{categoriaActual?.icono && <Icono nombre={categoriaActual.icono} />}{categoriaActual?.titulo ?? categoriaActual?.nombre}</h2><span>{contador(categoria)} seleccionados</span></div>
          {datos.lugares.filter(lugar => lugar.categoria === categoria).map(lugar => {
            const elegida = seleccion.some(visita => visita.lugarId === lugar.id)
            return <article className="iz-plan-lugar iz-plan-tarjeta" key={lugar.id}>
              <label className="iz-plan-lugar-seleccion">
                <input type="checkbox" aria-label={lugar.nombre} checked={elegida} onChange={() => elegida ? quitar(lugar.id) : actualizar(cambiarSeleccion([...seleccion, { lugarId: lugar.id, dia: 1 }]))} />
                <span className="iz-plan-lugar-textos"><strong className="iz-plan-lugar-titulo">{lugar.nombre}</strong><span className="iz-plan-insignia">{lugar.icono && <Icono nombre={lugar.icono} tamano={13} />}{lugar.etiqueta}</span></span>
              </label>
              <p>{lugar.descripcion}</p>
              <p className="iz-plan-nota">Visita: {duracionPlan(lugar.visitaMinutos)} · {lugar.trasladoTexto ?? `Traslado previo: ${duracionPlan(lugar.trasladoMinutos)} estimados`}</p>
            </article>
          })}
        </section>
        <LugaresSeleccionados jornadas={ventanas.length} lugares={lugaresElegidos} onQuitar={quitar}
          onCambiarDia={(id, dia) => actualizar(cambiarSeleccion(seleccion.map(visita => visita.lugarId === id ? { ...visita, dia } : visita)))} />
        <div className="iz-plan-resumen-final">
          <p role="status">{seleccion.length} lugares seleccionados</p>
          {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
          <CancelarEdicion editarId={sesion.borrador.editarId} />
          <button type="submit" className="iz-plan-primario">Generar mi itinerario<Icono nombre="arrow_forward" tamano={20} /></button>
          <button type="button" className="iz-plan-restablecer" onClick={restablecer}><Icono nombre="restart_alt" tamano={16} />Restablecer selección</button>
        </div>
      </form>
    </div>
  </article>
}
