import { NavLink } from 'react-router'
import Icono, { type NombreIcono } from '../ui/Icono'
const enlaces:{ruta:string;nombre:string;icono:NombreIcono}[]=[{ruta:'/',nombre:'Inicio',icono:'inicio'},{ruta:'/rutas',nombre:'Rutas',icono:'ruta'},{ruta:'/explorar',nombre:'Explorar',icono:'explorar'},{ruta:'/mi-viaje',nombre:'Mi viaje',icono:'calendario'},{ruta:'/perfil',nombre:'Perfil',icono:'persona'}]
export default function BarraInferior(){return <nav className="barra-inferior" aria-label="Navegación principal">{enlaces.map(e=><NavLink key={e.ruta} to={e.ruta} end={e.ruta==='/'}><Icono nombre={e.icono}/><span>{e.nombre}</span></NavLink>)}</nav>}
