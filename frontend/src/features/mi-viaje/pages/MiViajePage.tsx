import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { leerItinerariosLocales } from '../storage/itinerariosLocales'
import { urlBorrador } from '../plan/borradorIzamal'
import { calcularPlan, duracionPlan } from '../plan/itinerarioIzamal'
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
      const plan = calcularPlan(item.borrador).plan!
      return <li key={item.id} className="iz-plan-tarjeta"><h2>Izamal · {item.borrador.modo}</h2><p>{item.borrador.configuracion.fecha} · {item.borrador.configuracion.horaInicio} · {plan.seleccion.length} lugares · {duracionPlan(plan.totalMinutos)}</p><p>Guardado en este navegador: {new Date(item.guardadoEn).toLocaleString()}</p><Link to={urlBorrador('itinerario', item.borrador)}>Abrir itinerario de Izamal</Link></li>
    })}</ul>
    <Link className="iz-plan-primario" to="/rutas/izamal">Preparar otro itinerario en Izamal</Link>
  </section>
}
