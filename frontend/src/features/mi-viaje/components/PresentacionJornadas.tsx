import { fotografiaLugar } from '../../explorar/data/lugaresExplorar'
import type { DestinoExplorar } from '../../explorar/data/lugaresExplorar'
import ImagenItinerario from './ImagenItinerario'
import Icono from './IconoItinerario'
import type { JornadaPlan } from '../plan/recorridoJornadas'
import { duracionPlan } from '../plan/duracion'
import { horaLocal } from '../plan/tiempoLocal'

interface LugarJornada {
  id: string
  nombre: string
  descripcion?: string
  etiqueta?: string
  visitaMinutos: number
  trasladoMinutos: number
  categoria?: string
}

export default function PresentacionJornadas({ destino, jornadas, lugares, filtro = 'todas', categoriaDeLugar, etiquetaFiltro = 'esta categoría' }: {
  destino: DestinoExplorar
  jornadas: readonly JornadaPlan[]
  lugares: readonly LugarJornada[]
  filtro?: string
  categoriaDeLugar?: (lugar: LugarJornada) => string
  etiquetaFiltro?: string
}) {
  return <div className="iz-plan-viaje-jornadas">
    <section className="iz-plan-conexion iz-plan-tarjeta" aria-labelledby="viaje-transporte-titulo">
      <h2 id="viaje-transporte-titulo"><Icono nombre="directions_bus" tamano={18} />Transporte de la estancia</h2>
      <p>Llegada al destino el Día 1; horario y servicio por confirmar.</p>
      <p>El Día 2 inicia desde la zona central del poblado como referencia local. No incluye hospedaje ni traslados nocturnos.</p>
      <p>Un único regreso final al terminar el Día 2. Horario y disponibilidad sin confirmar.</p>
    </section>
    {jornadas.map(jornada => {
      const visitas = jornada.bloques.filter(bloque => bloque.tipo === 'visita')
      const visibles = visitas.filter(bloque => {
        const lugar = lugares.find(opcion => opcion.id === bloque.lugarId)
        return lugar && (filtro === 'todas' || categoriaDeLugar?.(lugar) === filtro)
      })
      const cierre = jornada.bloques.filter(bloque => bloque.tipo === 'margen' || (bloque.tipo === 'traslado' && !bloque.lugarId))
      return <section key={jornada.dia} className="iz-plan-jornada iz-plan-tarjeta" aria-labelledby={`jornada-${jornada.dia}-titulo`}>
        <header><h2 id={`jornada-${jornada.dia}-titulo`}>Día {jornada.dia}</h2><time dateTime={jornada.fecha}>{jornada.fecha}</time></header>
        <p className="iz-plan-jornada-resumen">Inicio elegido: {horaLocal(jornada, 0)} · {duracionPlan(Number(jornada.minutosDisponibles))} disponibles</p>
        <p>{duracionPlan(jornada.visitasMinutos)} de visitas + {duracionPlan(jornada.trasladosMinutos)} de traslados locales{jornada.dia === jornadas.length ? ' y traslado final' : ''} + {duracionPlan(jornada.margenMinutos)} de margen. Libres: {duracionPlan(jornada.libresMinutos)}.</p>
        {jornada.dia === 2 && <p className="iz-plan-nota">Los traslados locales parten de una referencia en la zona central del poblado; ajústala si comienzas en otro punto.</p>}
        <ol className="iz-plan-linea iz-plan-jornada-visitas" aria-label={`Visitas del Día ${jornada.dia}`}>
          {visibles.map((bloque, indice) => {
            const lugar = lugares.find(opcion => opcion.id === bloque.lugarId)!
            const traslado = jornada.bloques.find(opcion => opcion.tipo === 'traslado' && opcion.lugarId === lugar.id)
            const imagen = fotografiaLugar(destino, lugar.id)
            return <li key={lugar.id}>
              <span className="iz-plan-orden" aria-hidden="true">{indice + 1}</span>
              <article className="iz-plan-paso iz-plan-tarjeta">
                <p className="iz-plan-paso-hora"><time>{horaLocal(jornada, bloque.inicio)}</time> – <time>{horaLocal(jornada, bloque.fin)}</time>{lugar.etiqueta && <span className="iz-plan-insignia">{lugar.etiqueta}</span>}</p>
                {traslado && <p className="iz-plan-caminata"><Icono nombre="directions_walk" tamano={14} />Traslado local estimado: {duracionPlan(traslado.fin - traslado.inicio)} · {horaLocal(jornada, traslado.inicio)} – {horaLocal(jornada, traslado.fin)}</p>}
                <h3>{lugar.nombre}</h3>
                {lugar.descripcion && <p>{lugar.descripcion}</p>}
                <ImagenItinerario src={imagen?.src} alt={imagen?.alt ?? `Fotografía de ${lugar.nombre} pendiente de verificar`} credito={imagen?.credito} fuente={imagen?.fuente} className="iz-plan-imagen" />
                <p className="iz-plan-duracion">Visita estimada: {duracionPlan(lugar.visitaMinutos)}</p>
              </article>
            </li>
          })}
        </ol>
        {!visibles.length && <p role="status">{visitas.length ? `No hay visitas de “${etiquetaFiltro}” en el Día ${jornada.dia}. El filtro solo cambia la vista; el plan completo se conserva.` : `No hay lugares asignados al Día ${jornada.dia}.`}</p>}
        <div className="iz-plan-cierre"><h3>Cierre del Día {jornada.dia}</h3>{cierre.map(bloque => <p key={bloque.titulo}>{horaLocal(jornada, bloque.inicio)} – {horaLocal(jornada, bloque.fin)} · {bloque.titulo}: {duracionPlan(bloque.fin - bloque.inicio)}.</p>)}</div>
      </section>
    })}
  </div>
}
