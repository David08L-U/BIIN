import logo from '../../assets/biin-logo.png'
import '../../styles/logo-biin.css'

export default function LogoBiin({ tamaño = 'compacto' }: { tamaño?: 'compacto' | 'acceso' }) {
  return <img className={`logo-biin logo-biin--${tamaño}`} src={logo} alt="BIIN" />
}
