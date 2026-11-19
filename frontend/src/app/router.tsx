import { createBrowserRouter } from 'react-router'
import Layout from '../components/layout/Layout'
import PaginaEnConstruccion from '../components/layout/PaginaEnConstruccion'
import NoEncontradoPage from '../components/layout/NoEncontradoPage'
import RutaProtegida from '../features/auth/RutaProtegida'
import LoginPage from '../features/auth/pages/LoginPage'
import RegistroPage from '../features/auth/pages/RegistroPage'
import PerfilPage from '../features/auth/pages/PerfilPage'
import AyudaPage from '../features/auth/pages/AyudaPage'
import InicioPage from '../features/transporte/pages/InicioPage'
import RutasPage from '../features/transporte/pages/RutasPage'
import DetalleRutaPage from '../features/transporte/pages/DetalleRutaPage'
import ExplorarPage from '../features/exploracion/pages/ExplorarPage'
import PersonalizarPage from '../features/mi-viaje/pages/PersonalizarPage'
import ItinerarioPage from '../features/mi-viaje/pages/ItinerarioPage'
import MiViajePage from '../features/mi-viaje/pages/MiViajePage'
import FavoritosPage from '../features/mi-viaje/pages/FavoritosPage'
import AsistentePage from '../features/asistente/pages/AsistentePage'
export const router=createBrowserRouter([{element:<Layout/>,children:[
 {index:true,element:<InicioPage/>},
 {path:'rutas',element:<RutasPage/>},{path:'rutas/:id',element:<DetalleRutaPage/>},
 {path:'login',element:<LoginPage/>},{path:'registro',element:<RegistroPage/>},
 {path:'perfil',element:<PerfilPage/>},{path:'ayuda',element:<AyudaPage/>},
 {path:'explorar',element:<ExplorarPage/>},{path:'recorridos',element:<RutasPage/>},
 {path:'asistente',element:<AsistentePage/>},
 {path:'personalizar/:id',element:<PersonalizarPage/>},{path:'itinerario/:id',element:<ItinerarioPage/>},
 // Borradores locales del prototipo accesibles sin sesión, sin acceso a datos de cuenta.
 {path:'mi-viaje',element:<MiViajePage/>},{path:'favoritos',element:<FavoritosPage/>},
 {element:<RutaProtegida roles={['operador']}/>,children:[{path:'cupo',element:<PaginaEnConstruccion titulo="Reportar cupo" casos="CU-04"/>}]},
 {element:<RutaProtegida roles={['administrador']}/>,children:[{path:'admin',element:<PaginaEnConstruccion titulo="Administración" casos="CU-12"/>}]},
 {path:'*',element:<NoEncontradoPage/>},
]}])
