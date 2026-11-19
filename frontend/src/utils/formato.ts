export const moneda = (valor: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(valor)
export const duracion = (min: number) =>
  `${Math.floor(min / 60) ? `${Math.floor(min / 60)} h ` : ''}${min % 60 ? `${min % 60} min` : ''}`.trim() ||
  '0 min'
export const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
export const minutosDeHora = (hora: string) => {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}
export const horaDeMinutos = (min: number) =>
  `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
export const fechaLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const marcaActualizacion = () => new Date().toISOString()
