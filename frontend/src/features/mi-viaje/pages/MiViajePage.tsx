import { duracionPlan } from '../plan/duracion'
import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { leerItinerariosLocales } from '../storage/itinerariosLocales'
import { urlBorrador } from '../plan/borradorIzamal'
import { calcularPlan } from '../plan/itinerarioIzamal'
import { calcularPlanValladolid } from '../plan/itinerarioValladolid'
import { urlBorradorValladolid } from '../plan/borradorValladolid'
import { calcularPlanTekit } from '../plan/itinerarioTekit'
import { urlBorradorTekit } from '../plan/borradorTekit'
import { calcularPlanHomun } from '../plan/itinerarioHomun'
import { urlBorradorHomun } from '../plan/borradorHomun'
import { calcularPlanTicul } from '../plan/itinerarioTicul'
import { urlBorradorTicul } from '../plan/borradorTicul'
import '../../../styles/itinerario-izamal.css'

/** CU-09: el router conserva RutaProtegida; solo se lee la cuenta actual. */
export default function MiViajePage() {
  const { usuario } = useAuth()
  if (!usuario) return null
  const { itinerarios, error } = leerItinerariosLocales(usuario.idUsuario)
  return <section className="iz-plan iz-plan-mis-viajes" aria-labelledby="mis-viajes-titulo">
    <h1 id="mis-viajes-titulo">Mis itinerarios</h1>
    <p>Guardados en este navegador para {usuario.nombre}. Sin sincronización con una cuenta en el servidor.</p>
    {error && <p role="alert" className="iz-plan-error">{error}</p>}
    {!itinerarios.length && <p role="status">Todavía no hay itinerarios guardados para esta cuenta en este navegador.</p>}
    <ul>{itinerarios.map(item => {
      if (item.destino === 'ticul') {
        const plan = calcularPlanTicul(item.borrador).plan!
        return <li key={item.id} className="iz-plan-tarjeta"><h2>Ticul · {item.borrador.modo}</h2><p>{item.borrador.configuracion.fecha} · {item.borrador.configuracion.horaInicio} · {plan.seleccion.length} lugares · {duracionPlan(plan.totalMinutos)}</p><p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorradorTicul('itinerario', item.borrador)}>Abrir itinerario de Ticul</Link></li>
      }
      if (item.destino === 'homun') {
        const plan = calcularPlanHomun(item.borrador).plan!
        return <li key={item.id} className="iz-plan-tarjeta"><h2>Homún · {item.borrador.modo}</h2>{plan.jornadas.map(d => <p key={d.dia}>Día {d.dia} · {d.fecha} · {d.horaInicio} · {d.seleccion.length} lugares · {duracionPlan(d.totalMinutos)}</p>)}<p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorradorHomun('itinerario', item.borrador)}>Abrir itinerario de Homún</Link></li>
      }
      if (item.destino === 'tekit') {
        const plan = calcularPlanTekit(item.borrador).plan!
        return <li key={item.id} className="iz-plan-tarjeta"><h2>Tekit · {item.borrador.modo}</h2><p>{item.borrador.configuracion.fecha} · {item.borrador.configuracion.horaInicio} · {plan.seleccion.length} lugares · {duracionPlan(plan.totalMinutos)}</p><p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorradorTekit('itinerario', item.borrador)}>Abrir itinerario de Tekit</Link></li>
      }
      if (item.destino === 'valladolid') {
        const plan = calcularPlanValladolid(item.borrador).plan!
        return <li key={item.id} className="iz-plan-tarjeta"><h2>Valladolid · {item.borrador.modo}</h2>{plan.jornadas.map(dia => <p key={dia.dia}>Día {dia.dia} · {dia.fecha} · {dia.horaInicio} · {dia.seleccion.length} lugares · {duracionPlan(dia.totalMinutos)}</p>)}<p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorradorValladolid('itinerario', item.borrador)}>Abrir itinerario de Valladolid</Link></li>
      }
      const plan = calcularPlan(item.borrador).plan!
      return <li key={item.id} className="iz-plan-tarjeta"><h2>Izamal · {item.borrador.modo}</h2><p>{item.borrador.configuracion.fecha} · {item.borrador.configuracion.horaInicio} · {plan.seleccion.length} lugares · {duracionPlan(plan.totalMinutos)}</p><p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorrador('itinerario', item.borrador)}>Abrir itinerario de Izamal</Link></li>
    })}</ul>
    <Link className="iz-plan-primario" to="/rutas/izamal">Preparar otro itinerario en Izamal</Link>
    <Link className="iz-plan-primario" to="/rutas/valladolid">Preparar otro itinerario en Valladolid</Link>
    <Link className="iz-plan-primario" to="/rutas/tekit">Preparar otro itinerario en Tekit</Link>
    <Link className="iz-plan-primario" to="/rutas/homun">Preparar otro itinerario en Homún</Link>
    <Link className="iz-plan-primario" to="/rutas/ticul">Preparar otro itinerario en Ticul</Link>
  </section>
}
