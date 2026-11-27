import { createBrowserRouter } from 'react-router'

import EntradaApp from '../components/layout/EntradaApp'
import PaginaEnConstruccion from '../components/layout/PaginaEnConstruccion'
import NoEncontradoPage from '../components/layout/NoEncontradoPage'

import RutaProtegida from '../features/auth/RutaProtegida'
import LoginPage from '../features/auth/pages/LoginPage'
import RegistroPage from '../features/auth/pages/RegistroPage'

import InicioPage from '../features/transporte/pages/InicioPage'
import RutasPage from '../features/transporte/pages/RutasPage'
import DetalleRutaPage from '../features/transporte/pages/DetalleRutaPage'
import ItinerarioPage from '../features/mi-viaje/pages/ItinerarioPage'
import PersonalizarPage from '../features/mi-viaje/pages/PersonalizarPage'






import MiViajePage from '../features/mi-viaje/pages/MiViajePage'
import PerfilPage from '../features/perfil/pages/PerfilPage'
import VistaPreviaPerfilPage from '../features/perfil/pages/VistaPreviaPerfilPage'
import ExplorarPage, { ExplorarDetallePage } from '../features/explorar/pages/ExplorarPage'
import ElegirItinerarioPage from '../features/explorar/pages/ElegirItinerarioPage'
import EntradaItinerariosPage from '../features/mi-viaje/pages/EntradaItinerariosPage'
import ElegirModoItinerarioPage from '../features/explorar/pages/ElegirModoItinerarioPage'

export const router = createBrowserRouter([
  {
    element: <EntradaApp />,
    children: [
      ...(import.meta.env.DEV ? [{
        path: 'vista-previa/perfil',
        element: <VistaPreviaPerfilPage />,
      }] : []),
      {
        index: true,
        element: <InicioPage />,
      },
      {
        path: 'rutas',
        element: <RutasPage />,
      },
      {
        path: 'rutas/:id',
        element: <DetalleRutaPage />,
      },
      { path: 'rutas/:id/itinerario', element: <ItinerarioPage /> },
      { path: 'rutas/:id/personalizar', element: <PersonalizarPage /> },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'registro',
        element: <RegistroPage />,
      },
      { path: 'explorar/lugares/:destino/:id', element: <ExplorarDetallePage /> },
      { path: 'explorar', element: <ExplorarPage /> },
      {
        path: 'recorridos',
        element: <EntradaItinerariosPage />,
      },
      {
        path: 'recorridos/crear',
        element: <ElegirItinerarioPage />,
      },
      {
        path: 'recorridos/crear/:destino',
        element: <ElegirModoItinerarioPage />,
      },
      {
        path: 'asistente',
        element: (
          <PaginaEnConstruccion
            titulo="Asistente BIIN"
            casos="CU-08"
          />
        ),
      },
      {
        element: <RutaProtegida />,
        children: [
          {
            path: 'perfil',
            element: <PerfilPage />,
          },
          {
            path: 'mi-viaje',
            element: <MiViajePage />,
          },
        ],
      },
      {
        element: <RutaProtegida roles={['operador']} />,
        children: [
          {
            path: 'cupo',
            element: (
              <PaginaEnConstruccion
                titulo="Reportar cupo"
                casos="CU-04"
              />
            ),
          },
        ],
      },
      {
        element: (
          <RutaProtegida roles={['administrador']} />
        ),
        children: [
          {
            path: 'admin',
            element: (
              <PaginaEnConstruccion
                titulo="Administración"
                casos="CU-12"
              />
            ),
          },
        ],
      },
      {
        path: '*',
        element: <NoEncontradoPage />,
      },
    ],
  },
])
