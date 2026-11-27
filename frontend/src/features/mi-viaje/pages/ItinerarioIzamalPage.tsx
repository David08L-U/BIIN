import FiltrosPlan from '../components/FiltrosPlan'
import { duracionPlan } from '../plan/duracion'
import ModosPlan from '../components/ModosPlan'
import CabeceraPlan from '../components/CabeceraPlan'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import ConfiguracionViaje from '../components/ConfiguracionViaje'
import Icono from '../components/IconoItinerario'
import ImagenItinerario from '../components/ImagenItinerario'
import { imagenesItinerarioIzamal } from '../data/imagenesItinerarioIzamal'
import { fotografiaLugar } from '../../explorar/data/lugaresExplorar'
import { filtrosRecorridoIzamal, lugaresIzamal } from '../data/lugaresIzamal'
import type { CategoriaIzamal } from '../data/lugaresIzamal'
import { useBorradorIzamal } from '../hooks/useBorradorIzamal'
import { urlBorrador } from '../plan/borradorIzamal'
import { calcularPlan, estanciasIzamal, horaPlan, instantePlan } from '../plan/itinerarioIzamal'
import { useGuardarItinerarioServidor } from '../hooks/useGuardarItinerarioServidor'

export default function ItinerarioIzamalPage() {
  const { borrador, actualizar } = useBorradorIzamal()
  const { usuario, cargando } = useAuth()
  const { guardar: guardarEnServidor, guardando } = useGuardarItinerarioServidor()
  const navegar = useNavigate()
  const [filtro, setFiltro] = useState<CategoriaIzamal | 'todas'>('todas')
  const [erroresIntento, setErroresIntento] = useState<string[]>([])
  const [guardado, setGuardado] = useState<{ clave: string; mensaje: string; error: boolean } | null>(null)
  const [mostrarEnlace, setMostrarEnlace] = useState(false)
  const resultado = borrador.generado ? calcularPlan(borrador) : null
  const plan = resultado?.plan ?? null
  const errores = resultado?.errores ?? erroresIntento
  const urlActual = urlBorrador('itinerario', borrador)
  const claveGuardado = `${usuario?.idUsuario ?? 'visitante'}:${urlActual}`
  const avisoGuardado = guardado?.clave === claveGuardado ? guardado : null
  const urlPersonalizar = urlBorrador('personalizar', { ...borrador, modo: 'personalizado', generado: false })

  function generar(evento: FormEvent) {
    evento.preventDefault()
    const calculo = calcularPlan(borrador)
    setErroresIntento(calculo.errores)
    if (calculo.plan) actualizar({ generado: true })
  }
  async function guardar() {
    if (!plan || cargando || guardando) return
    if (!usuario) {
      navegar('/login', { state: { desde: urlActual } })
      return
    }
    if (borrador.editarId && !window.confirm(`¿Guardar cambios en el itinerario de Izamal del ${borrador.configuracion.fecha || 'fecha sin confirmar'}?`)) return
    const respuesta = await guardarEnServidor({ ...borrador, generado: true })
    if (!respuesta.itinerario) {
      setGuardado({ clave: claveGuardado, error: true, mensaje: respuesta.error ?? 'No se pudo confirmar el guardado en el servidor.' })
      return
    }
    const actualizado = { ...borrador, generado: true, editarId: respuesta.itinerario.id }
    actualizar({ editarId: respuesta.itinerario.id, generado: true })
    setGuardado({ clave: `${usuario.idUsuario}:${urlBorrador('itinerario', actualizado)}`, error: false, mensaje: borrador.editarId ? 'Cambios guardados en tu cuenta' : 'Itinerario guardado en tu cuenta' })
  }

  return (
    <article className="iz-plan iz-itinerario" aria-labelledby="iz-itinerario-titulo">
      <CabeceraPlan id="iz-itinerario-titulo" titulo="Tu Itinerario en Izamal" subtitulo="BIIN Escapadas" volver={urlBorrador('detalle', borrador)} acciones={<>
          <button type="button" className="iz-plan-icono-boton" disabled={!plan || cargando || guardando} onClick={guardar} aria-busy={guardando} aria-label={guardando ? 'Guardando itinerario' : borrador.editarId ? 'Guardar cambios' : 'Guardar itinerario'}><Icono nombre="bookmark" tamano={16} /></button>
          <button type="button" className="iz-plan-icono-boton" disabled={!plan} aria-label="Mostrar enlace del plan" onClick={() => setMostrarEnlace(valor => !valor)}><Icono nombre="share" tamano={16} /></button>

        </>} />
      <div className="iz-plan-estancia"><span><Icono nombre="schedule" tamano={14} />{estanciasIzamal[borrador.configuracion.estancia].nombre} en la Ciudad Amarilla</span><span className="iz-plan-insignia">Plan estimado</span></div>
      <ModosPlan
        modo={borrador.modo}
        recomendado={urlBorrador('itinerario', { ...borrador, modo: 'recomendado', generado: false })}
        personalizado={urlBorrador('personalizar', { ...borrador, modo: 'personalizado', generado: false })}
      />
      <form noValidate onSubmit={generar} className="iz-plan-formulario">
        <ConfiguracionViaje configuracion={borrador.configuracion} onChange={configuracion => { actualizar({ configuracion }); setErroresIntento([]) }} />
        <button type="submit" className="iz-plan-primario">{borrador.modo === 'personalizado' ? 'Generar itinerario personalizado' : 'Generar itinerario recomendado'}<Icono nombre="arrow_forward" tamano={20} /></button>
      </form>
      <p className="iz-plan-nota">Información demostrativa; aperturas, tarifas y transporte por confirmar. Recorrido no optimizado geográficamente.</p>
      {errores.length > 0 && <div className="iz-plan-error" role="alert">{errores.map(error => <p key={error}>{error}</p>)}</div>}
      {!borrador.generado && <p className="iz-plan-vacio" role="status">Aún no hay un plan vigente. Si cambiaste la configuración, genera de nuevo.{borrador.modo === 'personalizado' && ' Puedes cambiar los lugares en Personalizar.'}</p>}
      {plan && <>
        <section className="iz-plan-conexion iz-plan-tarjeta" aria-labelledby="iz-plan-conexion-titulo">
          <div className="iz-plan-conexion-titulo"><h2 id="iz-plan-conexion-titulo">Conexión Van BIIN</h2><span>Ruta Mérida · Izamal</span></div>
          <div className="iz-plan-conexion-fila"><Icono nombre="directions_bus" tamano={14} /><div><p className="iz-plan-ceja">Inicio elegido</p><strong>{horaPlan(borrador.configuracion, 0)} · Izamal Centro</strong><p>Punto de inicio ilustrativo. Llegada de la van sin confirmar.</p></div></div>
          <p className="iz-plan-conexion-margen"><Icono nombre="swap_vert" tamano={14} />{duracionPlan(Number(borrador.configuracion.minutosDisponibles))} disponibles · {duracionPlan(plan.libresMinutos)} libres</p>
          <div className="iz-plan-conexion-fila"><Icono nombre="departure_board" tamano={14} /><div><p className="iz-plan-ceja">Hora objetivo de regreso</p><strong>{horaPlan(borrador.configuracion, Number(borrador.configuracion.minutosDisponibles))}</strong><p>Objetivo del usuario; no es una salida confirmada de van.</p></div></div>
          <p className="iz-plan-nota">Visitas {duracionPlan(plan.visitasMinutos)} + desplazamientos estimados {duracionPlan(plan.trasladosMinutos)} + margen final {duracionPlan(plan.margenMinutos)} = {duracionPlan(plan.totalMinutos)}.</p>
        </section>
        <FiltrosPlan etiqueta="Filtrar recorrido" opciones={[{ id: 'todas', nombre: 'Ruta Sugerida' }, ...filtrosRecorridoIzamal]} activo={filtro} seleccionar={setFiltro} />
        <section className="iz-plan-recorrido" aria-labelledby="iz-plan-pasos">
          <div className="iz-plan-categoria-titulo"><h2 id="iz-plan-pasos">Paso a paso a pie</h2><span>{plan.seleccion.length} lugares</span></div>
          <ol className="iz-plan-linea">
            {plan.bloques.filter(bloque => bloque.tipo === 'visita').map((bloque, indice) => {
              const lugar = lugaresIzamal.find(opcion => opcion.id === bloque.lugarId)!
              if (filtro !== 'todas' && lugar.categoria !== filtro) return null
              const traslado = plan.bloques.find(opcion => opcion.tipo === 'traslado' && opcion.lugarId === lugar.id)!
              const imagen = fotografiaLugar('izamal', lugar.id)
              return <li key={lugar.id} value={indice + 1}>
                <span className="iz-plan-orden" aria-hidden="true">{indice + 1}</span>
                <article className="iz-plan-paso iz-plan-tarjeta">
                  <div className="iz-plan-paso-hora"><span><time dateTime={instantePlan(borrador.configuracion, bloque.inicio).toISOString()}>{horaPlan(borrador.configuracion, bloque.inicio)}</time> – <time dateTime={instantePlan(borrador.configuracion, bloque.fin).toISOString()}>{horaPlan(borrador.configuracion, bloque.fin)}</time></span><span className="iz-plan-insignia">{lugar.etiqueta}</span></div>
                  <p className="iz-plan-caminata"><Icono nombre="directions_walk" tamano={14} />{duracionPlan(traslado.fin - traslado.inicio)} de desplazamiento estimado · {horaPlan(borrador.configuracion, traslado.inicio)} – {horaPlan(borrador.configuracion, traslado.fin)}</p>
                  <h3>{lugar.nombre}</h3><p>{lugar.descripcion}</p>
                  <ImagenItinerario src={imagen?.src} alt={imagen?.alt ?? `Fotografía de ${lugar.nombre} pendiente de verificar`} credito={imagen?.credito} fuente={imagen?.fuente} />
                  <p className="iz-plan-duracion"><Icono nombre={lugar.categoria === 'gastronomia' ? 'restaurant_menu' : 'timer'} tamano={16} />Visita estimada: {duracionPlan(lugar.visitaMinutos)}</p>
                </article>
              </li>
            })}
          </ol>
          {filtro !== 'todas' && !plan.seleccion.some(id => lugaresIzamal.some(lugar => lugar.id === id && lugar.categoria === filtro)) && <p role="status">No hay lugares de esta categoría en el plan. El filtro no modifica el recorrido.</p>}
          <div className="iz-plan-cierre iz-plan-tarjeta"><h3>Cierre del recorrido</h3>{plan.bloques.slice(-2).map(bloque => <p key={bloque.titulo}>{horaPlan(borrador.configuracion, bloque.inicio)} – {horaPlan(borrador.configuracion, bloque.fin)} · {bloque.titulo}: {duracionPlan(bloque.fin - bloque.inicio)}.</p>)}<p>Quedan {duracionPlan(plan.libresMinutos)} libres antes de tu hora objetivo. Confirma el paradero y el transporte de regreso con la terminal.</p></div>
        </section>
        <section className="iz-plan-mapa iz-plan-tarjeta" aria-label="Mapa ilustrativo"><ImagenItinerario {...imagenesItinerarioIzamal.mapa} /><Link to={urlBorrador('detalle', borrador)}>Ver detalle de ruta<Icono nombre="arrow_forward" tamano={14} /></Link></section>
        <section className="iz-plan-consejos"><h2>Consejos de viaje BIIN</h2><div><article className="iz-plan-tarjeta"><Icono nombre="wb_sunny" tamano={20} /><h3>Protección solar</h3><p>Usa sombrero y mantén agua fresca en mano.</p></article><article className="iz-plan-tarjeta"><Icono nombre="payments" tamano={20} /><h3>Efectivo en mano</h3><p>Consulta los medios de pago, precios y horarios con cada lugar antes de visitarlo.</p></article></div></section>
      </>}
      <div className="iz-plan-resumen-final">
        {mostrarEnlace && plan && <label>Enlace del plan<input readOnly value={`${window.location.origin}${urlActual}`} onFocus={e => e.target.select()} /></label>}
        {!usuario && <p>Puedes preparar una vista previa sin sesión. Para guardar, inicia sesión; conservarás este borrador.</p>}
        {avisoGuardado && <p className={avisoGuardado.error ? 'iz-plan-error' : ''} role={avisoGuardado.error ? 'alert' : 'status'}>{avisoGuardado.mensaje}</p>}
        <div className="iz-plan-acciones"><button type="button" disabled={!plan || cargando} onClick={guardar}><Icono nombre="bookmark" tamano={14} />Guardar en este navegador</button><Link to={urlPersonalizar}><Icono nombre="tune" tamano={14} />Personalizar</Link></div>
        {usuario && <Link to="/mi-viaje">Ver mis itinerarios guardados</Link>}
      </div>
    </article>
  )
}
