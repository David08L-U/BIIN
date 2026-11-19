import { useAlmacenLocal } from '../../hooks/useAlmacenLocal'
const esLista = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((y) => typeof y === 'string')
export function useFavoritos() {
  const [favoritos, guardar, error] = useAlmacenLocal(
    'biin.favoritos.v1',
    [],
    esLista,
  )
  return {
    favoritos,
    error,
    alternar: (id: string) =>
      guardar((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
  }
}
