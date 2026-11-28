/** Contrato PaginaResultado<T> del backend. RF02 / CU-13. */
export interface PaginaResultado<T> {
  items: T[]
  total: number
  pagina: number
  tamano: number
}
