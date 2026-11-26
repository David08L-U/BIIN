import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

export function useScrollAlNavegar() {
  const { pathname, hash } = useLocation()
  const tipoNavegacion = useNavigationType()
  const rutaAnterior = useRef(pathname)

  useEffect(() => {
    if (rutaAnterior.current === pathname) return

    rutaAnterior.current = pathname

    if (tipoNavegacion === 'POP' || hash) return

    if (window.scrollX !== 0 || window.scrollY !== 0) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [pathname, hash, tipoNavegacion])
}