import PerfilVista from '../components/PerfilVista'
import { perfilDemostracion } from '../data/perfilDemostracion'

/** El router solo registra esta vista cuando Vite está en desarrollo. */
export default function VistaPreviaPerfilPage() {
  return <PerfilVista datos={perfilDemostracion} demostracion />
}
