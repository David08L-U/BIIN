import Icono from '../../../components/ui/Icono'
import { useMenu } from '../../../components/layout/menuContext'
export default function BuscadorCabecera({
  valor,
  cambiar,
}: {
  valor: string
  cambiar: (s: string) => void
}) {
  const menu = useMenu()
  return (
    <div className="buscador-cabecera">
      <button
        className="icon-button boton-menu"
        onClick={menu}
        aria-label="Abrir menú"
      >
        <Icono nombre="menu" />
      </button>
      <label className="buscador">
        <Icono nombre="buscar" />
        <span className="sr-only">Buscar rutas o destinos</span>
        <input
          placeholder="Buscar rutas o destinos…"
          value={valor}
          onChange={(e) => cambiar(e.target.value)}
        />
        {valor && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => cambiar('')}
          >
            <Icono nombre="cerrar" />
          </button>
        )}
      </label>
    </div>
  )
}
