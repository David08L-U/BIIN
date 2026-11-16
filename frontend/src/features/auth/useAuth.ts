import { useContext } from 'react'
import { AuthContext } from './authContextValor'

/** Sesión actual: usuario, roles y acciones de login/logout. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
