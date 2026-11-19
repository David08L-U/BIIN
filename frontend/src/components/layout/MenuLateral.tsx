import { createContext, useContext, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'
import Icono from '../ui/Icono'
export const MenuContext=createContext<()=>void>(()=>{})
export const useMenu=()=>useContext(MenuContext)
export default function MenuLateral({abierto,cerrar}:{abierto:boolean;cerrar:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null), location=useLocation()
 const {usuario,cerrarSesion,tieneRol}=useAuth()
 useEffect(()=>{if(abierto)dialog.current?.showModal();else dialog.current?.close()},[abierto])
 useEffect(()=>{cerrar()},[location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps
 return <dialog ref={dialog} className="menu-dialog" id="menu-biin" aria-label="Menú BIIN" onCancel={cerrar} onClick={e=>{if(e.target===e.currentTarget)cerrar()}}><div className="menu-contenido"><div className="fila"><Link className="marca" to="/">BIIN<span>●</span></Link><button className="icon-button" onClick={cerrar} aria-label="Cerrar menú"><Icono nombre="cerrar"/></button></div><div className="menu-usuario"><span className="avatar"><Icono nombre="persona"/></span><div><strong>{usuario?.nombre??'Hola, viajero'}</strong><p className="muted">{usuario?'Tu cuenta BIIN':'Descubre Yucatán a tu ritmo'}</p></div></div><nav aria-label="Menú lateral">{[
 ['/', 'inicio', 'Inicio'], ['/rutas','ruta','Rutas y destinos'],['/explorar','explorar','Explorar Yucatán'],['/mi-viaje','calendario','Mi viaje'],['/favoritos','guardar','Mis favoritos'],['/perfil','persona','Mi perfil'],['/asistente','ayuda','Asistente BIIN'],['/ayuda','escudo','Ayuda y accesibilidad'],
 ].map(([ruta,icono,label])=><NavLink key={ruta} to={ruta} end={ruta==='/'}><Icono nombre={icono as 'inicio'}/>{label}</NavLink>)}{tieneRol('operador')&&<NavLink to="/cupo">Reportar cupo</NavLink>}{tieneRol('administrador')&&<NavLink to="/admin">Administración</NavLink>}</nav><div className="menu-pie">{usuario?<button className="enlace" onClick={()=>{cerrarSesion();cerrar()}}>Cerrar sesión</button>:<Link className="boton boton--primario" to="/login">Iniciar sesión</Link>}<small>BIIN · Movilidad intermunicipal</small></div></div></dialog>
}
