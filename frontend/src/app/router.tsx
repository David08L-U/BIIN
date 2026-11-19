import {
  NoEncontradoPage,
  LoginPage,
  RegistroPage,
  PerfilPage,
  AyudaPage,
  InicioPage,
  RutasPage,
  DetalleRutaPage,
  ExplorarPage,
  PersonalizarPage,
  ItinerarioPage,
  MiViajePage,
  FavoritosPage,
  AsistentePage,
} from './paginas'
import { createBrowserRouter } from 'react-router'
import Layout from '../components/layout/Layout'
import PaginaEnConstruccion from '../components/layout/PaginaEnConstruccion'
import RutaProtegida from '../features/auth/RutaProtegida'
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <InicioPage /> },
      { path: 'rutas', element: <RutasPage /> },
      { path: 'rutas/:id', element: <DetalleRutaPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'registro', element: <RegistroPage /> },
      { path: 'perfil', element: <PerfilPage /> },
      { path: 'ayuda', element: <AyudaPage /> },
      { path: 'explorar', element: <ExplorarPage /> },
      { path: 'recorridos', element: <RutasPage /> },
      { path: 'asistente', element: <AsistentePage /> },
      { path: 'personalizar/:id', element: <PersonalizarPage /> },
      { path: 'itinerario/:id', element: <ItinerarioPage /> },
      // Borradores locales del prototipo accesibles sin sesión, sin acceso a datos de cuenta.
      { path: 'mi-viaje', element: <MiViajePage /> },
      { path: 'favoritos', element: <FavoritosPage /> },
      {
        element: <RutaProtegida roles={['operador']} />,
        children: [
          {
            path: 'cupo',
            element: (
              <PaginaEnConstruccion titulo="Reportar cupo" casos="CU-04" />
            ),
          },
        ],
      },
      {
        element: <RutaProtegida roles={['administrador']} />,
        children: [
          {
            path: 'admin',
            element: (
              <PaginaEnConstruccion titulo="Administración" casos="CU-12" />
            ),
          },
        ],
      },
      { path: '*', element: <NoEncontradoPage /> },
    ],
  },
])
