import { fotografiaLugar } from '../../explorar/data/lugaresExplorar'
import type { DestinoId } from '../../destinos/contratos'
import type { DatosPlanificador } from '../plan/adaptarPlanificador'
import type { JornadaPlan } from '../plan/recorridoJornadas'
import { duracionPlan } from '../plan/duracion'
import { horaLocal, instanteLocal } from '../plan/tiempoLocal'
import Icono from './IconoItinerario'
import ImagenItinerario from './ImagenItinerario'

export function ConexionPlan({ datos, dia }: { datos: DatosPlanificador; dia: JornadaPlan }) {
  return <section className="iz-plan-conexion iz-plan-tarjeta" aria-labelledby="conexion-plan-titulo">
    <header className="iz-plan-conexion-titulo"><h2 id="conexion-plan-titulo">Conexión Van BIIN</h2><span>Ruta Mérida · {datos.nombre}</span><Icono nombre="directions_bus" tamano={20} /></header>
    <div className="iz-plan-conexion-tramo">
      <div><p className="iz-plan-ceja">Inicio elegido · <strong>{horaLocal(dia, 0)}</strong></p><p>{datos.inicio}. Punto de referencia ilustrativo; llegada sin confirmar.</p></div>
      <p className="iz-plan-conexion-margen"><Icono nombre="schedule" tamano={15} />{duracionPlan(Number(dia.minutosDisponibles))} disponibles · {duracionPlan(dia.libresMinutos)} libres</p>
      <div><p className="iz-plan-ceja">Hora objetivo de regreso · <strong>{horaLocal(dia, Number(dia.minutosDisponibles))}</strong></p><p>Objetivo del usuario; no es una salida confirmada de van.</p></div>
    </div>
    <p className="iz-plan-nota">Visitas {duracionPlan(dia.visitasMinutos)} + traslados {duracionPlan(dia.trasladosMinutos)} + margen {duracionPlan(dia.margenMinutos)} = {duracionPlan(dia.totalMinutos)}.</p>
  </section>
}

export default function RecorridoPlan({ destino, datos, dia, filtro }: { destino: DestinoId; datos: DatosPlanificador; dia: JornadaPlan; filtro: string }) {
  const visitas = dia.bloques.filter(bloque => bloque.tipo === 'visita')
  const visibles = visitas.flatMap((bloque, indice) => {
    const lugar = datos.lugares.find(opcion => opcion.id === bloque.lugarId)
    if (!lugar || (filtro !== 'todas' && (datos.categoriaRecorrido?.(lugar) ?? lugar.categoria) !== filtro)) return []
    return [{ bloque, indice, lugar }]
  })
  const TituloLugar = datos.mostrarDia ? 'h4' : 'h3'
  const cierre = <div className="iz-plan-cierre iz-plan-tarjeta">
    <TituloLugar>Cierre del recorrido</TituloLugar>
    {dia.bloques.slice(-2).map(bloque => <p key={bloque.titulo}>{horaLocal(dia, bloque.inicio)} – {horaLocal(dia, bloque.fin)} · {bloque.titulo}: {duracionPlan(bloque.fin - bloque.inicio)}.</p>)}
    <p>Tiempo libre: {duracionPlan(dia.libresMinutos)} · {horaLocal(dia, dia.totalMinutos)} – {horaLocal(dia, Number(dia.minutosDisponibles))}. Confirma el transporte con la terminal.</p>
  </div>

  return <section className="iz-plan-recorrido" aria-labelledby="recorrido-plan-titulo">
    <div className="iz-plan-categoria-titulo"><h2 id="recorrido-plan-titulo">{datos.recorrido}</h2><span>{dia.seleccion.length} lugares</span></div>
    <div className={datos.mostrarDia ? 'iz-plan-jornada' : undefined}>
      {datos.mostrarDia && <h3>Día {dia.dia} · <time dateTime={dia.fecha}>{dia.fecha}</time></h3>}
      <ol className="iz-plan-linea" aria-label={datos.lista ?? (datos.mostrarDia ? `Recorrido del Día ${dia.dia}` : undefined)}>
        {visibles.map(({ bloque, indice, lugar }) => {
          const traslado = dia.bloques.find(opcion => opcion.tipo === 'traslado' && opcion.lugarId === lugar.id)
          const imagen = fotografiaLugar(destino, lugar.id)
          return <li key={lugar.id} value={indice + 1}>
            <span className="iz-plan-orden" aria-hidden="true">{indice + 1}</span>
            <article className="iz-plan-paso iz-plan-tarjeta">
              <div className="iz-plan-paso-hora"><span><time dateTime={instanteLocal(dia, bloque.inicio).toISOString()}>{horaLocal(dia, bloque.inicio)}</time> – <time dateTime={instanteLocal(dia, bloque.fin).toISOString()}>{horaLocal(dia, bloque.fin)}</time></span><span className="iz-plan-insignia">{lugar.etiqueta}</span></div>
              {traslado && <p className="iz-plan-caminata"><Icono nombre={lugar.trasladoIcono ?? 'directions_walk'} tamano={14} />{lugar.trasladoTexto ?? `${duracionPlan(traslado.fin - traslado.inicio)} de desplazamiento estimado`} · {horaLocal(dia, traslado.inicio)} – {horaLocal(dia, traslado.fin)}</p>}
              <TituloLugar>{lugar.nombre}</TituloLugar><p>{lugar.descripcion}</p>
              <ImagenItinerario src={imagen?.src} alt={imagen?.alt ?? `Fotografía de ${lugar.nombre} pendiente de verificar`} credito={imagen?.credito} fuente={imagen?.fuente} className="iz-plan-imagen" />
              <p className="iz-plan-duracion">Visita estimada: {duracionPlan(lugar.visitaMinutos)}</p>
            </article>
          </li>
        })}
        {datos.cierreEnLista && <li><span className="iz-plan-orden iz-plan-orden-cierre" aria-hidden="true"><Icono nombre="flag" tamano={16} /></span>{cierre}</li>}
      </ol>
      {!visibles.length && <p role="status">No hay visitas de esta categoría. El filtro conserva el plan y sus horarios.</p>}
      {!datos.cierreEnLista && cierre}
    </div>
  </section>
}
