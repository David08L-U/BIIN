import { Link } from 'react-router'

export default function NoEncontradoPage() {
  return (
    <section className="pagina">
      <h1>Página no encontrada</h1>
      <p><Link to="/">Volver al inicio</Link></p>
    </section>
  )
}
