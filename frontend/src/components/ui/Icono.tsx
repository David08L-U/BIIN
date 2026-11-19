import type { SVGProps } from 'react'
const trazos = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  buscar: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  volver: 'm12 5-7 7 7 7M5 12h15',
  cerrar: 'm6 6 12 12M6 18 18 6',
  inicio: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
  ruta: 'M5 21V7a4 4 0 0 1 8 0v10a4 4 0 0 0 8 0V3M2 18l3 3 3-3M18 6l3-3 3 3',
  explorar: 'm12 3 9 18-9-4-9 4 9-18ZM12 9v8',
  calendario: 'M4 5h16v16H4ZM8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 17h2',
  persona: 'M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  reloj: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6v6l4 2',
  bus: 'M5 17h14V6c0-3-14-3-14 0v11ZM5 10h14M7 17v3M17 17v3M8 14h.01M16 14h.01',
  guardar: 'M6 3h12v18l-6-4-6 4V3Z',
  corazon:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  templo:
    'M3 10h18M5 10v10M19 10v10M10 13v7M14 13v7M3 21h18M6 6l6-4 6 4M12 2v4',
  agua: 'M12 2C10 6 4 11 4 15a8 8 0 0 0 16 0c0-4-6-9-8-13ZM8 15a4 4 0 0 0 4 4',
  taller: 'm14 3 7 7-3 3-7-7 3-3ZM12 7 3 16v5h5l9-9',
  comida: 'M4 3v6a3 3 0 0 0 6 0V3M7 3v18M19 3c-5 4-5 10 0 10V3ZM19 13v8',
  asiento: 'M7 3v10h11v8M5 11v5h10M7 6h.01',
  dinero: 'M3 5h18v14H3ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M6 8h.01M18 16h.01',
  descargar: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  ajustes: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
  mas: 'M12 4v16M4 12h16',
  menos: 'M4 12h16',
  capas: 'm12 3 10 6-10 6L2 9l10-6ZM2 15l10 6 10-6',
  ubicacion:
    'M12 2v3M12 19v3M2 12h3M19 12h3M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  salir: 'M9 3H3v18h6M8 12h13m-5-5 5 5-5 5',
  ayuda:
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 8a3 3 0 0 1 6 0c0 3-3 2-3 5M12 17h.01',
  sol: 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  escudo: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3ZM8 12l3 3 5-6',
  flecha: 'm9 5 7 7-7 7',
  comprobar: 'm5 12 4 4L19 6',
  compartir:
    'M18 8 6 12l12 4M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M21 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  sinConexion:
    'm3 3 18 18M2 8a17 17 0 0 1 3-2M9 5a17 17 0 0 1 13 3M5 12a11 11 0 0 1 5-2M15 11a11 11 0 0 1 4 1M8 16a5 5 0 0 1 7-1M12 20h.01',
} as const
export type NombreIcono = keyof typeof trazos
export default function Icono({
  nombre,
  ...props
}: SVGProps<SVGSVGElement> & { nombre: NombreIcono }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={trazos[nombre]} />
    </svg>
  )
}
