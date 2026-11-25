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

import ItinerarioIzamalPage from '../features/mi-viaje/pages/ItinerarioIzamalPage'
import PersonalizarIzamalPage from '../features/mi-viaje/pages/PersonalizarIzamalPage'

import ItinerarioValladolidPage from '../features/mi-viaje/pages/ItinerarioValladolidPage'
import PersonalizarValladolidPage from '../features/mi-viaje/pages/PersonalizarValladolidPage'

import ItinerarioTekitPage from '../features/mi-viaje/pages/ItinerarioTekitPage'
import PersonalizarTekitPage from '../features/mi-viaje/pages/PersonalizarTekitPage'

import ItinerarioHomunPage from '../features/mi-viaje/pages/ItinerarioHomunPage'
import PersonalizarHomunPage from '../features/mi-viaje/pages/PersonalizarHomunPage'

import ItinerarioTiculPage from '../features/mi-viaje/pages/ItinerarioTiculPage'
import PersonalizarTiculPage from '../features/mi-viaje/pages/PersonalizarTiculPage'

import MiViajePage from '../features/mi-viaje/pages/MiViajePage'

export const router = createBrowserRouter([
  {
    element: <EntradaApp />,
    children: [
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
      {
        path: 'rutas/izamal/itinerario',
        element: <ItinerarioIzamalPage />,
      },
      {
        path: 'rutas/izamal/personalizar',
        element: <PersonalizarIzamalPage />,
      },
      {
        path: 'rutas/valladolid/itinerario',
        element: <ItinerarioValladolidPage />,
      },
      {
        path: 'rutas/valladolid/personalizar',
        element: <PersonalizarValladolidPage />,
      },
      {
        path: 'rutas/tekit/itinerario',
        element: <ItinerarioTekitPage />,
      },
      {
        path: 'rutas/tekit/personalizar',
        element: <PersonalizarTekitPage />,
      },
      {
        path: 'rutas/homun/itinerario',
        element: <ItinerarioHomunPage />,
      },
      {
        path: 'rutas/homun/personalizar',
        element: <PersonalizarHomunPage />,
      },
      {
        path: 'rutas/ticul/itinerario',
        element: <ItinerarioTiculPage />,
      },
      {
        path: 'rutas/ticul/personalizar',
        element: <PersonalizarTiculPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'registro',
        element: <RegistroPage />,
      },
      {
        path: 'explorar',
        element: (
          <PaginaEnConstruccion
            titulo="Explorar"
            casos="CU-05, CU-06, CU-07, CU-14"
          />
        ),
      },
      {
        path: 'recorridos',
        element: (
          <PaginaEnConstruccion
            titulo="Recorridos sugeridos"
            casos="CU-13"
          />
        ),
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
            element: (
              <PaginaEnConstruccion
                titulo="Mi perfil"
                casos="CU-01"
              />
            ),
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