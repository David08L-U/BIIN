import { createBrowserRouter } from 'react-router'
import Layout from '../components/layout/Layout'
import PaginaEnConstruccion from '../components/layout/PaginaEnConstruccion'
import NoEncontradoPage from '../components/layout/NoEncontradoPage'
import RutaProtegida from '../features/auth/RutaProtegida'
import LoginPage from '../features/auth/pages/LoginPage'
import RegistroPage from '../features/auth/pages/RegistroPage'
import InicioPage from '../features/transporte/pages/InicioPage'

/** Rutas de la app. Cada módulo reemplaza su PaginaEnConstruccion al programarse. */
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // Consulta pública sin registro (RF01)
      { index: true, element: <InicioPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'registro', element: <RegistroPage /> },
      { path: 'explorar', element: <PaginaEnConstruccion titulo="Explorar" casos="CU-05, CU-06, CU-07, CU-14" /> },
      { path: 'recorridos', element: <PaginaEnConstruccion titulo="Recorridos sugeridos" casos="CU-13" /> },
      { path: 'asistente', element: <PaginaEnConstruccion titulo="Asistente BIIN" casos="CU-08" /> },

      // Requieren sesión
      {
        element: <RutaProtegida />,
        children: [
          { path: 'mi-viaje', element: <PaginaEnConstruccion titulo="Mi viaje" casos="CU-09, CU-10" /> },
        ],
      },
      {
        element: <RutaProtegida roles={['operador']} />,
        children: [
          { path: 'cupo', element: <PaginaEnConstruccion titulo="Reportar cupo" casos="CU-04" /> },
        ],
      },
      {
        element: <RutaProtegida roles={['administrador']} />,
        children: [
          { path: 'admin', element: <PaginaEnConstruccion titulo="Administración" casos="CU-12" /> },
        ],
      },

      { path: '*', element: <NoEncontradoPage /> },
    ],
  },
])
