import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { detalleValladolidPrototipo } from '../../transporte/data/detalleValladolidPrototipo'
import ConfiguracionValladolid from '../components/ConfiguracionValladolid'
import Icono from '../components/IconoItinerario'
import ImagenItinerario from '../components/ImagenItinerario'
import { lugaresValladolid } from '../data/lugaresValladolid'
import { useBorradorValladolid } from '../hooks/useBorradorValladolid'
import { parametrosBorradorValladolid, urlBorradorValladolid } from '../plan/borradorValladolid'
import { calcularPlanValladolid, esEstanciaValladolid, estanciasValladolid } from '../plan/itinerarioValladolid'
import type { JornadaValladolid } from '../plan/itinerarioValladolid'
import { horaLocal, instanteLocal } from '../plan/tiempoLocal'
import { duracionPlan } from '../plan/itinerarioIzamal'
import { compartirValladolid, descargarValladolid } from '../plan/accionesValladolid'
import type { AvisoCompartir } from '../plan/accionesValladolid'
import { guardarItinerarioLocal } from '../storage/itinerariosLocales'
import '../../../styles/itinerario-valladolid.css'

function Conexion({ dia }: { dia: JornadaValladolid }) {
  return <section className="va-conexion va-tarjeta" aria-label={`Conexión BIIN del Día ${dia.dia}`}>
    <header><h2><Icono nombre="directions_bus" tamano={18} />Conexión BIIN</h2><span>Ruta Mérida · Valladolid</span></header>
    <div className="va-conexion-contenido">
      <p className="va-ceja">Día {dia.dia} · {dia.fecha}</p>
      <div className="va-conexion-fila"><span><Icono nombre="pin_drop" tamano={16} /></span><div><p className="va-ceja">Inicio elegido · {horaLocal(dia, 0)}</p><strong>Valladolid Centro</strong><p>Frente al Parque Principal Francisco Cantón. Referencia del prototipo; llegada del transporte sin confirmar.</p></div></div>
      <div className="va-conexion-margen"><span><Icono nombre="directions_walk" tamano={16} />Tiempo para la visita</span><strong>{duracionPlan(Number(dia.minutosDisponibles))}</strong></div>
      <div className="va-conexion-fila"><span className="va-regreso-icono"><Icono nombre="sync_alt" tamano={16} /></span><div><p className="va-ceja">Hora objetivo de regreso · {horaLocal(dia, Number(dia.minutosDisponibles))}</p><strong>Referencia de regreso del prototipo</strong><p>Objetivo del usuario; no es una salida confirmada. Confirma punto y transporte con la terminal.</p></div></div>
      <p className="va-nota">Visitas {dia.visitasMinutos} min + traslados {dia.trasladosMinutos} min (incluye traslado final) + margen {dia.margenMinutos} min = {dia.totalMinutos} min. Libres: {dia.libresMinutos} min.</p>
    </div>
  </section>
}

export default function ItinerarioValladolidPage() {
  const { borrador, actualizar } = useBorradorValladolid()
  const { usuario, cargando } = useAuth()
  const navegar = useNavigate()
  const [filtro, setFiltro] = useState<'todas' | 'cultural-cenotes' | 'gastronomia'>('todas')
  const clave = parametrosBorradorValladolid(borrador).toString()
  const [intento, setIntento] = useState<{ clave: string; errores: string[] } | null>(null)
  const [aviso, setAviso] = useState<{ clave: string; mensaje: string; error: boolean } | null>(null)
  const [compartido, setCompartido] = useState<{ clave: string; respuesta: AvisoCompartir } | null>(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const resultado = borrador.generado ? calcularPlanValladolid(borrador) : null
  const plan = resultado?.plan ?? null
  const borradorVigente = plan ? { ...borrador, seleccion: plan.seleccion } : borrador
  const errores = resultado?.errores ?? (intento?.clave === clave ? intento.errores : [])
  const urlActual = urlBorradorValladolid('itinerario', borradorVigente)
  const claveCuenta = `${usuario?.idUsuario ?? 'visitante'}:${clave}`
  const avisoActual = aviso?.clave === claveCuenta ? aviso : null
  const compartirActual = compartido?.clave === clave ? compartido.respuesta : null
  const personalizar = urlBorradorValladolid('personalizar', { ...borrador, seleccion: plan?.seleccion ?? borrador.seleccion, modo: 'personalizado', generado: false })
  const nombreEstancia = esEstanciaValladolid(borrador.configuracion.estancia) ? estanciasValladolid[borrador.configuracion.estancia].nombre : 'Estancia sin validar'

  function generar(evento: FormEvent) {
    evento.preventDefault()
    const calculo = calcularPlanValladolid(borrador)
    setIntento({ clave, errores: calculo.errores })
    if (calculo.plan) actualizar({ generado: true, seleccion: calculo.plan.seleccion })
  }
  function guardar() {
    if (!plan || cargando) return
    if (!usuario) { navegar('/login', { state: { desde: urlActual } }); return }
    const respuesta = guardarItinerarioLocal(usuario.idUsuario, borradorVigente)
    setAviso({ clave: claveCuenta, error: !respuesta.guardado, mensaje: respuesta.guardado ? 'Guardado en este navegador' : respuesta.error ?? 'No se pudo guardar el itinerario.' })
  }
  async function compartir() {
    if (!plan || compartiendo) return
    setCompartiendo(true)
    try { setCompartido({ clave, respuesta: await compartirValladolid(new URL(urlActual, window.location.origin).href) }) }
    finally { setCompartiendo(false) }
  }
  function descargar() {
    if (!plan) return
    try {
      descargarValladolid(borradorVigente, plan)
      setAviso({ clave: claveCuenta, error: false, mensaje: 'Se solicitó la descarga del plan. El archivo no incluye mapas offline.' })
    } catch { setAviso({ clave: claveCuenta, error: true, mensaje: 'No se pudo descargar el plan. Inténtalo de nuevo desde un navegador que permita descargar archivos.' }) }
  }

  return <article className="va-plan" aria-labelledby="va-itinerario-titulo">
    <header className="va-cabecera">
      <Link className="va-icono-boton" to={urlBorradorValladolid('detalle', borradorVigente)} aria-label="Volver a detalle de ruta"><Icono nombre="arrow_back" tamano={22} /></Link>
      <div className="va-titulo"><p className="va-ceja">BIIN Escapadas</p><h1 id="va-itinerario-titulo">Tu Itinerario en Valladolid</h1></div>
      <div className="va-utilidades"><button type="button" className="va-icono-boton" disabled={!plan || cargando} onClick={guardar} aria-label="Guardar itinerario"><Icono nombre="bookmark_border" tamano={20} /></button><button type="button" className="va-icono-boton" disabled={!plan || compartiendo} onClick={compartir} aria-label="Compartir"><Icono nombre="share" tamano={20} /></button></div>
    </header>
    <div className="va-contenido">
      <p className="va-estancia"><Icono nombre="schedule" tamano={16} />{nombreEstancia} en la Sultana del Oriente · Plan estimado</p>
      <div className="va-modos" role="group" aria-label="Modo de planificación"><Link aria-current={borrador.modo === 'recomendado' ? 'page' : undefined} to={urlBorradorValladolid('itinerario', { ...borrador, modo: 'recomendado', generado: false })}>Recomendado</Link><Link aria-current={borrador.modo === 'personalizado' ? 'page' : undefined} to={personalizar}>Personalizado</Link></div>
      <form className="va-formulario" noValidate onSubmit={generar}><ConfiguracionValladolid borrador={borrador} onChange={nuevo => actualizar(nuevo)} /><button type="submit" className="va-primario">Generar itinerario {borrador.modo === 'personalizado' ? 'personalizado' : 'recomendado'}<Icono nombre="arrow_forward" tamano={18} /></button></form>
      <p className="va-nota">Vista previa estimada. Lugares, imágenes, visitas y caminatas del prototipo, sin fecha de validación. Tarifas, aperturas y transporte sin confirmar. No es una optimización geográfica real.</p>
      {errores.length > 0 && <div className="va-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
      {!borrador.generado && <p className="va-vacio" role="status">Aún no hay un plan vigente. Si cambiaste configuración o selección, genera de nuevo.</p>}
      {plan && <>
        {plan.jornadas.map(dia => <Conexion dia={dia} key={dia.dia} />)}
        <div className="va-filtros" role="group" aria-label="Filtrar recorrido">{([['todas', 'Ruta Sugerida'], ['cultural-cenotes', 'Cultural & Cenotes'], ['gastronomia', 'Gastronomía']] as const).map(([id, nombre]) => <button type="button" key={id} aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nombre}</button>)}</div>
        <section className="va-recorrido" aria-labelledby="va-pasos-titulo">
          <div className="va-seccion-titulo"><h2 id="va-pasos-titulo">Paso a paso a pie</h2><span>{plan.seleccion.length} lugares</span></div>
          {plan.jornadas.map(dia => {
            const visitas = dia.bloques.filter(b => b.tipo === 'visita')
            const visibles = visitas.filter(b => { const lugar = lugaresValladolid.find(l => l.id === b.lugarId)!; return filtro === 'todas' || (filtro === 'gastronomia' ? lugar.categoria === 'gastronomia' : lugar.categoria !== 'gastronomia') })
            return <section className="va-jornada" key={dia.dia} aria-labelledby={`va-dia-${dia.dia}`}>
              <h3 id={`va-dia-${dia.dia}`}>Día {dia.dia} · <time dateTime={dia.fecha}>{dia.fecha}</time></h3>
              <ol className="va-linea" aria-label={`Recorrido del Día ${dia.dia}`}>
                {visitas.map((bloque, indice) => {
                  if (!visibles.includes(bloque)) return null
                  const lugar = lugaresValladolid.find(l => l.id === bloque.lugarId)!
                  const traslado = dia.bloques.find(b => b.tipo === 'traslado' && b.lugarId === lugar.id)!
                  return <li key={lugar.id} value={indice + 1}><span className="va-orden" aria-hidden="true">{indice + 1}</span><article className="va-paso va-tarjeta">
                    <div className="va-paso-hora"><span><time dateTime={instanteLocal(dia, bloque.inicio).toISOString()}>{horaLocal(dia, bloque.inicio)}</time> – <time dateTime={instanteLocal(dia, bloque.fin).toISOString()}>{horaLocal(dia, bloque.fin)}</time></span><span>{lugar.etiqueta}</span></div>
                    <p className="va-caminata"><Icono nombre="directions_walk" tamano={14} />Traslado estimado: {traslado.fin - traslado.inicio} min · {horaLocal(dia, traslado.inicio)} – {horaLocal(dia, traslado.fin)}</p>
                    <h4>{lugar.nombre}</h4><p>{lugar.descripcion}</p>
                    {'imagen' in lugar && <ImagenItinerario {...lugar.imagen} className="va-imagen" />}
                    <p className="va-duracion">Visita estimada: {lugar.visitaMinutos} min</p>
                  </article></li>
                })}
                <li><span className="va-orden va-orden-cierre" aria-hidden="true"><Icono nombre="flag" tamano={18} /></span><div className="va-cierre va-tarjeta"><p className="va-ceja">Cierre del recorrido · Día {dia.dia}</p><h4>Regreso al punto de referencia</h4>{dia.bloques.slice(-2).map(b => <p key={b.titulo}>{horaLocal(dia, b.inicio)} – {horaLocal(dia, b.fin)} · {b.titulo}: {b.fin - b.inicio} min.</p>)}<p>Quedan {dia.libresMinutos} min libres. Hora objetivo: {horaLocal(dia, Number(dia.minutosDisponibles))}; no es una salida confirmada.</p></div></li>
              </ol>
              {!visibles.length && <p role="status">No hay visitas de esta categoría en el Día {dia.dia}. El filtro solo cambia las tarjetas visibles, no el plan ni sus horarios.</p>}
            </section>
          })}
        </section>
        <section className="va-mapa va-tarjeta" aria-label="Circuito Peatonal Valladolid"><div className="va-seccion-titulo"><h2><Icono nombre="map" tamano={20} />Circuito Peatonal Valladolid</h2><Link to={urlBorradorValladolid('detalle', borrador)}>Ver detalle de ruta<Icono nombre="open_in_new" tamano={16} /></Link></div><div className="va-mapa-imagen"><ImagenItinerario src={detalleValladolidPrototipo.imagenRecorrido} alt="Mapa ilustrativo de Valladolid del prototipo" className="va-imagen" /><span>Referencia ilustrativa · Sin GPS</span></div></section>
        <section className="va-consejos va-tarjeta" aria-labelledby="va-consejos-titulo"><h2 id="va-consejos-titulo"><Icono nombre="lightbulb" tamano={20} />Consejos de viaje BIIN</h2><div><span><Icono nombre="footprint" tamano={18} /></span><p><strong>Calzado cómodo</strong><span>Camina sobre adoquín colonial y aceras de piedra.</span></p></div><div><span><Icono nombre="pool" tamano={18} /></span><p><strong>Traje de baño y toalla</strong><span>Consulta las condiciones y aperturas antes de visitar el Cenote Zací.</span></p></div></section>
      </>}
      <div className="va-resumen-final">
        {!usuario && <p>Puedes preparar una vista previa sin sesión. Para guardar, inicia sesión; conservarás este borrador.</p>}
        {avisoActual && <p className={avisoActual.error ? 'va-error' : ''} role={avisoActual.error ? 'alert' : 'status'}>{avisoActual.mensaje}</p>}
        {compartirActual && <p role="status">{compartirActual.mensaje}</p>}
        {plan && compartirActual?.estado === 'manual' && <label>Enlace de la vista previa<input type="url" readOnly value={new URL(urlActual, window.location.origin).href} onFocus={e => e.target.select()} /></label>}
        <button type="button" className="va-guardar" disabled={!plan || cargando} onClick={guardar}><Icono nombre="bookmark_border" tamano={18} />Guardar en este navegador</button>
        <div className="va-acciones"><button type="button" disabled={!plan} onClick={descargar}><Icono nombre="cloud_download" tamano={18} />Descargar plan</button><Link to={personalizar}><Icono nombre="tune" tamano={18} />Personalizar</Link></div>
        <p>La descarga contiene el itinerario en texto; no incluye mapas offline.</p>
        {usuario && <Link to="/mi-viaje">Ver mis itinerarios guardados</Link>}
      </div>
    </div>
  </article>
}
