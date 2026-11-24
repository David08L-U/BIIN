import { createBrowserRouter } from 'react-router'

import Layout from '../components/layout/Layout'
import PaginaEnConstruccion from '../components/layout/PaginaEnConstruccion'
import NoEncontradoPage from '../components/layout/NoEncontradoPage'

import RutaProtegida from '../features/auth/RutaProtegida'
import LoginPage from '../features/auth/pages/LoginPage'
import RegistroPage from '../features/auth/pages/RegistroPage'

import InicioPage from '../features/transporte/pages/InicioPage'
import RutasPage from '../features/transporte/pages/RutasPage'
import DetalleRutaPage from '../features/transporte/pages/DetalleRutaPage'

export const router = createBrowserRouter([
  {
    element: <Layout />,
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
            element: (
              <PaginaEnConstruccion
                titulo="Mi viaje"
                casos="CU-09, CU-10"
              />
            ),
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
