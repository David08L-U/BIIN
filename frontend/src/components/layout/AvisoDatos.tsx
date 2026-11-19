import { modoDemo } from '../../services/catalogo'
import { useConexion } from '../../hooks/useConexion'
export default function AvisoDatos() {
  const online = useConexion()
  return (
    <>
      {modoDemo && (
        <div className="aviso-demo">
          Vista de demostración · Datos del prototipo sin validar
        </div>
      )}
      {!online && (
        <div className="aviso-offline" role="status">
          Sin conexión · Solo puedes consultar lo guardado en este dispositivo.
          Los mapas requieren internet.
        </div>
      )}
    </>
  )
}
