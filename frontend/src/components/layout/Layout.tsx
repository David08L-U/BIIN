import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import MenuLateral,{ MenuContext } from './MenuLateral'
import BarraInferior from './BarraInferior'
import AvisoDatos from './AvisoDatos'
import Icono from '../ui/Icono'
export default function Layout(){
 const [abierto,setAbierto]=useState(false),{pathname}=useLocation()
 const auth=pathname==='/login'||pathname==='/registro'
 useEffect(()=>{window.scrollTo(0,0)},[pathname])
 return <MenuContext.Provider value={()=>setAbierto(true)}><div className={`app ${auth?'app-auth':''}`}><a className="saltar" href="#contenido">Saltar al contenido</a>{!auth&&<header className="barra-escritorio"><button className="icon-button" onClick={()=>setAbierto(true)} aria-label="Abrir menú"><Icono nombre="menu"/></button><Link className="marca" to="/">BIIN<span>●</span></Link><span>Yucatán, un destino a la vez.</span><Link to="/rutas">Explora las rutas</Link></header>}<AvisoDatos/><main id="contenido"><Outlet/></main>{!auth&&<BarraInferior/>}<MenuLateral abierto={abierto} cerrar={()=>setAbierto(false)}/></div></MenuContext.Provider>
}
