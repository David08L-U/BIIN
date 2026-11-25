import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'
import Layout from './Layout'

export default function EntradaApp() {
  const ubicacion = useLocation()
  const { usuario, cargando } = useAuth()

  const [claveInicial] = useState(ubicacion.key)

  const esEntradaInicial =
    ubicacion.pathname === '/' &&
    ubicacion.key === claveInicial

  if (esEntradaInicial && cargando) {
    return (
      <main id="contenido" className="biin-acceso">
        <p className="estado">Cargando sesión…</p>
      </main>
    )
  }

  if (esEntradaInicial && !usuario) {
    return <Navigate to="/login" replace />
  }

  return <Layout />
}