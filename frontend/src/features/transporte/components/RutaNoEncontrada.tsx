import { Link } from 'react-router'

export default function RutaNoEncontrada() {
  return <section className="pagina" aria-labelledby="ruta-no-encontrada">
    <h1 id="ruta-no-encontrada">Ruta no encontrada</h1>
    <p>No encontramos ese destino en el catálogo de BIIN.</p>
    <Link to="/rutas">Volver al catálogo de rutas</Link>
  </section>
}
