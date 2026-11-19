import { lazy } from 'react'
export const NoEncontradoPage = lazy(
  () => import('../components/layout/NoEncontradoPage'),
)
export const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'))
export const RegistroPage = lazy(
  () => import('../features/auth/pages/RegistroPage'),
)
export const PerfilPage = lazy(
  () => import('../features/auth/pages/PerfilPage'),
)
export const AyudaPage = lazy(() => import('../features/auth/pages/AyudaPage'))
export const InicioPage = lazy(
  () => import('../features/transporte/pages/InicioPage'),
)
export const RutasPage = lazy(
  () => import('../features/transporte/pages/RutasPage'),
)
export const DetalleRutaPage = lazy(
  () => import('../features/transporte/pages/DetalleRutaPage'),
)
export const ExplorarPage = lazy(
  () => import('../features/exploracion/pages/ExplorarPage'),
)
export const PersonalizarPage = lazy(
  () => import('../features/mi-viaje/pages/PersonalizarPage'),
)
export const ItinerarioPage = lazy(
  () => import('../features/mi-viaje/pages/ItinerarioPage'),
)
export const MiViajePage = lazy(
  () => import('../features/mi-viaje/pages/MiViajePage'),
)
export const FavoritosPage = lazy(
  () => import('../features/mi-viaje/pages/FavoritosPage'),
)
export const AsistentePage = lazy(
  () => import('../features/asistente/pages/AsistentePage'),
)
